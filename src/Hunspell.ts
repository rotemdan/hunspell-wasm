import { getRandomId } from './Utilities.js'
import { WasmMemoryManager } from './WasmMemoryManager.js'

export async function createHunspellFromFiles(affixesFilePath: string, dictionaryFilePath: string, key?: string) {
	const { readFile } = await import('fs/promises')

	const affixes = await readFile(affixesFilePath, 'utf-8')
	const dictionary = await readFile(dictionaryFilePath, 'utf-8')

	return createHunspellFromStrings(affixes, dictionary, key)
}

export async function createHunspellFromStrings(affixes: string, dictionary: string, key?: string) {
	const wasmModule = await getWasmModule()

	const hunspell = new Hunspell(wasmModule, affixes, dictionary, key)

	return hunspell
}

// C API methods not wrapped yet: Hunspell_stem2, Hunspell_generate2

export class Hunspell {
	private readonly wasmModule: any
	private wasmMemory: WasmMemoryManager
	private hunspellHandle: number
	private disposed = false

	constructor(wasmModule: any, affixes: string, dictionary: string, key?: string) {
		if (this.isDisposed) {
			throw new Error(`Hunspell instance has been disposed. It cannot be re-initialized.`)
		}

		this.wasmModule = wasmModule
		const m = wasmModule

		this.wasmMemory = new WasmMemoryManager(m)

		const randomId = getRandomId()
		const affixesVirtualFileName = `${randomId}.aff`
		const dictionaryVirtualFileName = `${randomId}.dic`

		m.FS.writeFile(affixesVirtualFileName, affixes)
		m.FS.writeFile(dictionaryVirtualFileName, dictionary)

		const affixesVirtualFileNameRef = this.wasmMemory.allocNullTerminatedUtf8String(affixesVirtualFileName)
		const dictionaryVirtualFileNameRef = this.wasmMemory.allocNullTerminatedUtf8String(dictionaryVirtualFileName)

		if (key) {
			const keyRef = this.wasmMemory.allocNullTerminatedUtf8String(key)

			this.hunspellHandle = m.Hunspell_create_key(affixesVirtualFileNameRef.address, dictionaryVirtualFileNameRef.address, keyRef.address)

			keyRef.free()
		} else {
			this.hunspellHandle = m._Hunspell_create(affixesVirtualFileNameRef.address, dictionaryVirtualFileNameRef.address)
		}

		m.FS.unlink(affixesVirtualFileName)
		m.FS.unlink(dictionaryVirtualFileName)

		affixesVirtualFileNameRef.free()
		dictionaryVirtualFileNameRef.free()

		if (this.hunspellHandle === 0) {
			throw new Error(`Failed to create hunspell instance`)
		}
	}

	testSpelling(word: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const wordRef = wasmMemory.allocNullTerminatedUtf8String(word)

		const result = m._Hunspell_spell(hunspellHandle, wordRef.address)

		wordRef.free()

		return Boolean(result)
	}

	getSpellingSuggestions(word: string) {
		return this.performStringListResultOperation(word, 'suggest')
	}

	getSuffixSuggestions(word: string) {
		return this.performStringListResultOperation(word, 'suffix_suggest')
	}

	analyzeWord(word: string) {
		return this.performStringListResultOperation(word, 'analyze')
	}

	stemWord(word: string) {
		return this.performStringListResultOperation(word, 'stem')
	}

	private performStringListResultOperation(word: string, operationId: StringListResultOperationId) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const wordRef = wasmMemory.allocNullTerminatedUtf8String(word)

		const resultPtrRef = wasmMemory.allocPointer()

		let resultCount: number

		if (operationId === 'suggest') {
			resultCount = m._Hunspell_suggest(hunspellHandle, resultPtrRef.address, wordRef.address)
		} else if (operationId === 'suffix_suggest') {
			resultCount = m._Hunspell_suffix_suggest(hunspellHandle, resultPtrRef.address, wordRef.address)
		} else if (operationId === 'analyze') {
			resultCount = m._Hunspell_analyze(hunspellHandle, resultPtrRef.address, wordRef.address)
		} else if (operationId === 'stem') {
			resultCount = m._Hunspell_stem(hunspellHandle, resultPtrRef.address, wordRef.address)
		} else {
			throw `Unsupported operation ID: ${operationId}`
		}

		let results: string[] = []

		if (resultCount > 0 && resultPtrRef.value !== 0) {
			results = this.readStringList(resultPtrRef.value, resultCount)

			m._Hunspell_free_list(hunspellHandle, resultPtrRef.address, resultCount)
		}

		resultPtrRef.free()
		wordRef.free()

		return results
	}

	generateByExample(word1: string, word2: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const word1Ref = wasmMemory.allocNullTerminatedUtf8String(word1)
		const word2Ref = wasmMemory.allocNullTerminatedUtf8String(word2)

		const resultPtrRef = wasmMemory.allocPointer()

		const resultCount = m._Hunspell_generate(hunspellHandle, resultPtrRef.address, word1Ref.address, word2Ref.address)

		let results: string[] = []

		if (resultCount > 0 && resultPtrRef.value !== 0) {
			results = this.readStringList(resultPtrRef.value, resultCount)

			m._Hunspell_free_list(hunspellHandle, resultPtrRef.address, resultCount)
		}

		resultPtrRef.free()
		word1Ref.free()
		word2Ref.free()

		return results
	}

	addWord(newWord: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const wordRef = wasmMemory.allocNullTerminatedUtf8String(newWord)

		const errorCode: number = m._Hunspell_add(hunspellHandle, wordRef.address)

		wordRef.free()

		if (errorCode !== 0) {
			throw new Error(`addWord failed with error code ${errorCode}`)
		}
	}

	addWordWithFlags(newWord: string, flags: string, description: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const wordRef = wasmMemory.allocNullTerminatedUtf8String(newWord)
		const flagsRef = wasmMemory.allocNullTerminatedUtf8String(flags)
		const descriptionRef = wasmMemory.allocNullTerminatedUtf8String(description)

		const errorCode: number = m._Hunspell_add_with_flags(hunspellHandle, wordRef.address, flagsRef.address, descriptionRef.address)

		descriptionRef.free()
		flagsRef.free()
		wordRef.free()

		if (errorCode !== 0) {
			throw new Error(`addWordWithFlags failed with error code ${errorCode}`)
		}
	}

	addWordWithAffix(newWord: string, example: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const wordRef = wasmMemory.allocNullTerminatedUtf8String(newWord)
		const exampleRef = wasmMemory.allocNullTerminatedUtf8String(example)

		const errorCode: number = m._Hunspell_add_with_affix(hunspellHandle, wordRef.address, exampleRef.address)

		exampleRef.free()
		wordRef.free()

		if (errorCode !== 0) {
			throw new Error(`addWordWithAffix failed with error code ${errorCode}`)
		}
	}

	removeWord(wordToRemove: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const wordRef = wasmMemory.allocNullTerminatedUtf8String(wordToRemove)

		const errorCode: number = m._Hunspell_remove(hunspellHandle, wordRef.address)

		wordRef.free()

		if (errorCode !== 0) {
			throw new Error(`removeWord failed with error code ${errorCode}`)
		}
	}

	async addDictionaryFromFile(dictionaryFilePath: string) {
		const { readFile } = await import('fs/promises')

		const dictionary = await readFile(dictionaryFilePath, 'utf-8')

		this.addDictionaryFromString(dictionary)
	}

	addDictionaryFromString(dictionary: string) {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory
		const hunspellHandle = this.hunspellHandle

		const randomId = getRandomId()
		const dictionaryVirtualFileName = `${randomId}.dic`

		const dictionaryVirtualFileNameRef = wasmMemory.allocNullTerminatedUtf8String(dictionaryVirtualFileName)

		m.FS.writeFile(dictionaryVirtualFileName, dictionary)

		const errorCode: number = m._Hunspell_add_dic(hunspellHandle, dictionaryVirtualFileNameRef.address)

		m.FS.unlink(dictionaryVirtualFileName)

		dictionaryVirtualFileNameRef.free()

		if (errorCode !== 0) {
			throw new Error(`addDictionaryFromString failed with error code ${errorCode}`)
		}
	}

	getDictionaryEncoding() {
		this.ensureNotDisposed()

		const m = this.wasmModule
		const wasmMemory = this.wasmMemory!
		const hunspellHandle = this.hunspellHandle

		const stringAddress = m._Hunspell_get_dic_encoding(hunspellHandle)

		const stringRef = wasmMemory.wrapNullTerminatedUtf8String(stringAddress).detach()

		const value = stringRef.value

		return value
	}

	dispose() {
		if (this.isDisposed) {
			return
		}

		const m = this.wasmMemory.wasmModule

		m._Hunspell_destroy(this.hunspellHandle)

		if (this.wasmMemory) {
			this.wasmMemory.freeAll()
		}

		this.hunspellHandle = undefined as any
		this.disposed = true
	}

	private readStringList(address: number, count: number) {
		if (count === 0 || address === 0) {
			return []
		}

		const wasmMemory = this.wasmMemory

		const pointerArrayRef = wasmMemory.wrapUint32Array(address, count).detach()
		const pointerArrayElements = pointerArrayRef.view

		const values: string[] = []

		for (let i = 0; i < count; i++) {
			const wrappedString = wasmMemory.wrapNullTerminatedUtf8String(pointerArrayElements[i]).detach()

			values.push(wrappedString.value)
		}

		return values
	}

	private ensureNotDisposed() {
		if (this.isDisposed) {
			throw new Error(`Hunspell instance has been disposed`)
		}
	}

	get isDisposed() {
		return this.disposed
	}
}

let hunspellWasmInstance: any

export async function getWasmModule() {
	if (!hunspellWasmInstance) {
		const { default: initializer } = await import('../wasm/hunspell.js')

		hunspellWasmInstance = await initializer()
	}

	return hunspellWasmInstance
}

type StringListResultOperationId = 'suggest' | 'suffix_suggest' | 'analyze' | 'stem'
