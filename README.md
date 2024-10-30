# Hunspell (WebAssembly port)

WebAssembly port of the [Hunspell](https://github.com/hunspell/hunspell) spell-checking library.

Includes a fully-featured and easy-to-use wrapper written in TypeScript.

## Installation

```
npm install hunspell-wasm
```

## Usage

```ts
// Import
import { createHunspellFromFiles } from 'hunspell-wasm'

// Create instance (dictionary paths are illustrative)
const hunspell = await createHunspellFromFiles('dict/en-US.aff', 'dict/en-US.dic')

console.log(hunspell.testSpelling('Hello'))
// Output: true

console.log(hunspell.testSpelling('Hellow'))
// Output: false

console.log(hunspell.getSpellingSuggestions('Hellow'))
// Output: [ 'Hello', 'Hell ow', 'Hello w', 'Howell', 'Lowell' ]

// Dispose instance
hunspell.dispose()
```

You can also create the Hunspell instance using affix and dictionary file content given as strings, instead of file paths:

```ts
import { createHunspellFromStrings } from 'hunspell-wasm'

const affixes = ``

const dictionary = `
Hello
World
`

const hunspell = await createHunspellFromStrings(affixes, dictionary)
```

Add or remove words from dictionary:
```ts
hunspell.addWord('foobar')
hunspell.removeWord('foobar')
```

Add a dictionary using `hunspell.addDictionaryFromFile` or `hunspell.addDictionaryFromString`:

```ts
await hunspell.addDictionaryFromFile('dict/myDictionary.dic')

const dictionaryString = `
Yes
No
`

hunspell.addDictionaryFromString(dictionaryString)
```

Other supported methods:
```ts
hunspell.getSuffixSuggestions('run')
// Output: [ 'runs', "run's" ]

hunspell.analyzeWord('Capturing')
// Output: [ ' st:capture fl:G' ]

hunspell.stemWord('Capturing')
// Output: [ 'capture' ]
```

## Importing within a CommonJS module

Use a dynamic `import` expression in an `async` function context:

`MyCommonJSModule.cjs`:

```ts
async function start() {
	const { createHunspellFromFiles } = await import('hunspell-wasm')

	//...
}
```

## Dictionary files

You can find `.aff` and `.dic` dictionary files for many different languages in [`titoBouzout`'s repository](https://github.com/titoBouzout/Dictionaries/).

## Building the WebAssembly module

See instructions [here](docs/Building.md).

## TODO

* Wrap C API methods `Hunspell_stem2`, `Hunspell_generate`, `Hunspell_generate2`

## License

Hunspell is licensed under LGPL/GPL/MPL tri-license.

