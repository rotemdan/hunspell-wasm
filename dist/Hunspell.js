import { readFile } from 'fs/promises';
import { getRandomId } from './Utilities.js';
import { WasmMemoryManager } from './WasmMemoryManager.js';
export async function createHunspellFromFiles(affixesFilePath, dictionaryFilePath, key) {
    const affixes = await readFile(affixesFilePath, 'utf-8');
    const dictionary = await readFile(dictionaryFilePath, 'utf-8');
    return createHunspellFromStrings(affixes, dictionary, key);
}
export async function createHunspellFromStrings(affixes, dictionary, key) {
    const hunspell = new Hunspell();
    await hunspell.initialize(affixes, dictionary, key);
    return hunspell;
}
// C API methods not implemented yet: wrap Hunspell_stem2, Hunspell_generate, Hunspell_generate2
export class Hunspell {
    hunspellHandle;
    wasmMemory;
    disposed = false;
    constructor() {
    }
    async initialize(affixes, dictionary, key) {
        if (this.isDisposed) {
            throw new Error(`Hunspell instance has been disposed. It cannot be re-initialized.`);
        }
        if (this.hunspellHandle) {
            throw new Error(`Hunspell instance has already been initialized.`);
        }
        const m = await getInstance();
        this.wasmMemory = new WasmMemoryManager(m);
        const randomId = getRandomId();
        const affixesVirtualFileName = `${randomId}.aff`;
        const dictionaryVirtualFileName = `${randomId}.dic`;
        m.FS.writeFile(affixesVirtualFileName, affixes);
        m.FS.writeFile(dictionaryVirtualFileName, dictionary);
        const affixesVirtualFileNameRef = this.wasmMemory.allocNullTerminatedUtf8String(affixesVirtualFileName);
        const dictionaryVirtualFileNameRef = this.wasmMemory.allocNullTerminatedUtf8String(dictionaryVirtualFileName);
        if (key) {
            const keyRef = this.wasmMemory.allocNullTerminatedUtf8String(key);
            this.hunspellHandle = m.Hunspell_create_key(affixesVirtualFileNameRef.address, dictionaryVirtualFileNameRef.address, keyRef.address);
            keyRef.free();
        }
        else {
            this.hunspellHandle = m._Hunspell_create(affixesVirtualFileNameRef.address, dictionaryVirtualFileNameRef.address);
        }
        m.FS.unlink(affixesVirtualFileName);
        m.FS.unlink(dictionaryVirtualFileName);
        affixesVirtualFileNameRef.free();
        dictionaryVirtualFileNameRef.free();
    }
    testSpelling(word) {
        this.ensureInitializedAndNotDisposed();
        const m = this.wasmModule;
        const wasmMemory = this.wasmMemory;
        const hunspellHandle = this.hunspellHandle;
        const wordRef = wasmMemory.allocNullTerminatedUtf8String(word);
        const result = m._Hunspell_spell(hunspellHandle, wordRef.address);
        wordRef.free();
        return Boolean(result);
    }
    getSpellingSuggestions(word) {
        return this.performStringListResultOperation(word, 'suggest');
    }
    getSuffixSuggestions(word) {
        return this.performStringListResultOperation(word, 'suffix_suggest');
    }
    analyzeWord(word) {
        return this.performStringListResultOperation(word, 'analyze');
    }
    stemWord(word) {
        return this.performStringListResultOperation(word, 'stem');
    }
    performStringListResultOperation(word, operationId) {
        this.ensureInitializedAndNotDisposed();
        const m = this.wasmModule;
        const wasmMemory = this.wasmMemory;
        const hunspellHandle = this.hunspellHandle;
        const wordRef = wasmMemory.allocNullTerminatedUtf8String(word);
        const resultPtrRef = wasmMemory.allocPointer();
        let resultCount;
        if (operationId === 'suggest') {
            resultCount = m._Hunspell_suggest(hunspellHandle, resultPtrRef.address, wordRef.address);
        }
        else if (operationId === 'suffix_suggest') {
            resultCount = m._Hunspell_suffix_suggest(hunspellHandle, resultPtrRef.address, wordRef.address);
        }
        else if (operationId === 'analyze') {
            resultCount = m._Hunspell_analyze(hunspellHandle, resultPtrRef.address, wordRef.address);
        }
        else if (operationId === 'stem') {
            resultCount = m._Hunspell_stem(hunspellHandle, resultPtrRef.address, wordRef.address);
        }
        else {
            throw `Unsupported operation ID: ${operationId}`;
        }
        let suggestions = [];
        if (resultCount > 0 && resultPtrRef.value !== 0) {
            suggestions = this.readStringList(resultPtrRef.value, resultCount);
            m._Hunspell_free_list(hunspellHandle, resultPtrRef.address, resultCount);
        }
        resultPtrRef.free();
        wordRef.free();
        return suggestions;
    }
    addWord(newWord, options) {
        if (options?.flags != null && options?.affixReferenceWord != null) {
            throw new Error(`Either 'flags' or 'affixReferenceWord' options can be optionally provided, but not both at the same time.`);
        }
        this.ensureInitializedAndNotDisposed();
        const m = this.wasmModule;
        const wasmMemory = this.wasmMemory;
        const hunspellHandle = this.hunspellHandle;
        const wordRef = wasmMemory.allocNullTerminatedUtf8String(newWord);
        let errorCode;
        if (options?.flags) {
            const flagsRef = wasmMemory.allocNullTerminatedUtf8String(options.flags);
            errorCode = m._Hunspell_add_with_flags(hunspellHandle, wordRef.address, flagsRef.address);
            flagsRef.free();
        }
        else if (options?.affixReferenceWord) {
            const affixReferenceWordRef = wasmMemory.allocNullTerminatedUtf8String(options.affixReferenceWord);
            errorCode = m._Hunspell_add_with_affix(hunspellHandle, wordRef.address, affixReferenceWordRef.address);
            affixReferenceWordRef.free();
        }
        else {
            errorCode = m._Hunspell_add(hunspellHandle, wordRef.address);
        }
        wordRef.free();
        if (errorCode !== 0) {
            throw new Error(`addWord failed with error code ${errorCode}`);
        }
    }
    removeWord(wordToRemove) {
        this.ensureInitializedAndNotDisposed();
        const m = this.wasmModule;
        const wasmMemory = this.wasmMemory;
        const hunspellHandle = this.hunspellHandle;
        const wordRef = wasmMemory.allocNullTerminatedUtf8String(wordToRemove);
        const errorCode = m._Hunspell_remove(hunspellHandle, wordRef.address);
        wordRef.free();
        if (errorCode !== 0) {
            throw new Error(`removeWord failed with error code ${errorCode}`);
        }
    }
    async addDictionaryFromFile(dictionaryFilePath) {
        const dictionary = await readFile(dictionaryFilePath, 'utf-8');
        this.addDictionaryFromString(dictionary);
    }
    addDictionaryFromString(dictionary) {
        this.ensureInitializedAndNotDisposed();
        const m = this.wasmModule;
        const wasmMemory = this.wasmMemory;
        const hunspellHandle = this.hunspellHandle;
        const randomId = getRandomId();
        const dictionaryVirtualFileName = `${randomId}.dic`;
        const dictionaryVirtualFileNameRef = wasmMemory.allocNullTerminatedUtf8String(dictionaryVirtualFileName);
        m.FS.writeFile(dictionaryVirtualFileName, dictionary);
        const errorCode = m._Hunspell_add_dic(hunspellHandle, dictionaryVirtualFileNameRef.address);
        m.FS.unlink(dictionaryVirtualFileName);
        dictionaryVirtualFileNameRef.free();
        if (errorCode !== 0) {
            throw new Error(`addDictionaryFromString failed with error code ${errorCode}`);
        }
    }
    getDictionaryEncoding() {
        this.ensureInitializedAndNotDisposed();
        const m = this.wasmModule;
        const wasmMemory = this.wasmMemory;
        const hunspellHandle = this.hunspellHandle;
        const stringAddress = m._Hunspell_get_dic_encoding(hunspellHandle);
        const stringRef = wasmMemory.wrapNullTerminatedUtf8String(stringAddress).detach();
        const value = stringRef.value;
        return value;
    }
    dispose() {
        if (this.isDisposed) {
            return;
        }
        const m = this.wasmMemory.wasmModule;
        m._Hunspell_destroy(this.hunspellHandle);
        if (this.wasmMemory) {
            this.wasmMemory.freeAll();
        }
        this.hunspellHandle = undefined;
        this.wasmMemory = undefined;
        this.disposed = true;
    }
    readStringList(address, count) {
        if (count === 0 || address === 0) {
            return [];
        }
        const wasmMemory = this.wasmMemory;
        const resultArrayRef = wasmMemory.wrapUint32Array(address, count).detach();
        const values = [];
        for (let i = 0; i < count; i++) {
            const wrappedString = wasmMemory.wrapNullTerminatedUtf8String(resultArrayRef.view[i]).detach();
            values.push(wrappedString.value);
        }
        return values;
    }
    ensureInitializedAndNotDisposed() {
        if (this.isDisposed) {
            throw new Error(`Hunspell instance has been disposed`);
        }
        if (!this.isInitialized) {
            throw new Error(`Hunspell instance has not been initialized`);
        }
    }
    get isInitialized() {
        return this.hunspellHandle != null;
    }
    get isDisposed() {
        return this.disposed;
    }
    get wasmModule() {
        if (this.isInitialized) {
            return this.wasmMemory.wasmModule;
        }
        return undefined;
    }
}
let hunspellWasmInstance;
async function getInstance() {
    if (!hunspellWasmInstance) {
        const { default: initializer } = await import('../wasm/hunspell.js');
        hunspellWasmInstance = await initializer();
    }
    return hunspellWasmInstance;
}
//# sourceMappingURL=Hunspell.js.map