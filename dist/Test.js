import { createHunspellFromFiles } from './Hunspell.js';
const log = console.log;
export async function test() {
    const hunspell = await createHunspellFromFiles('dict/English (American).aff', 'dict/English (American).dic');
    log(hunspell.getDictionaryEncoding());
    log(hunspell.testSpelling('Hello'));
    log(hunspell.testSpelling('Hellow'));
    log(hunspell.getSpellingSuggestions('Hellow'));
    log(hunspell.getSuffixSuggestions('run'));
    log(hunspell.analyzeWord('Capturing'));
    log(hunspell.stemWord('Capturing'));
    log(hunspell.testSpelling('Baba'));
    hunspell.addWord('Baba');
    log(hunspell.testSpelling('Baba'));
    log(hunspell.getSpellingSuggestions('Baba'));
    hunspell.removeWord('Baba');
    log(hunspell.testSpelling('Baba'));
    log(hunspell.getSpellingSuggestions('Baba'));
    hunspell.dispose();
}
test();
//# sourceMappingURL=Test.js.map