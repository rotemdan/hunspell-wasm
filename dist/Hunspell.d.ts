export declare function createHunspellFromFiles(affixesFilePath: string, dictionaryFilePath: string, key?: string): Promise<Hunspell>;
export declare function createHunspellFromStrings(affixes: string, dictionary: string, key?: string): Promise<Hunspell>;
export declare class Hunspell {
    private hunspellHandle?;
    private wasmMemory?;
    private disposed;
    constructor();
    initialize(affixes: string, dictionary: string, key?: string): Promise<void>;
    testSpelling(word: string): boolean;
    getSpellingSuggestions(word: string): string[];
    getSuffixSuggestions(word: string): string[];
    analyzeWord(word: string): string[];
    stemWord(word: string): string[];
    private performStringListResultOperation;
    addWord(newWord: string, options?: {
        flags?: string;
        affixReferenceWord?: string;
    }): void;
    removeWord(wordToRemove: string): void;
    addDictionaryFromFile(dictionaryFilePath: string): Promise<void>;
    addDictionaryFromString(dictionary: string): void;
    getDictionaryEncoding(): string;
    dispose(): void;
    private readStringList;
    private ensureInitializedAndNotDisposed;
    get isInitialized(): boolean;
    get isDisposed(): boolean;
    private get wasmModule();
}
