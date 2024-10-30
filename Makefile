PROJ=hunspell

EMCCFLAGS=-s ALLOW_MEMORY_GROWTH=1 -s STACK_SIZE=1MB -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_Hunspell_create', '_Hunspell_create_key', '_Hunspell_destroy', '_Hunspell_add_dic', '_Hunspell_spell', '_Hunspell_get_dic_encoding', '_Hunspell_suggest', '_Hunspell_suffix_suggest', '_Hunspell_analyze', '_Hunspell_stem', '_Hunspell_stem2', '_Hunspell_generate', '_Hunspell_generate2', '_Hunspell_add', '_Hunspell_add_with_flags', '_Hunspell_add_with_affix', '_Hunspell_remove', '_Hunspell_free_list']" -s EXPORTED_RUNTIME_METHODS="['FS']" -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME="Hunspell"

all: lib/hunspell/affentry.cxx lib/hunspell/csutil.cxx lib/hunspell/filemgr.cxx lib/hunspell/hunspell.cxx lib/hunspell/phonet.cxx lib/hunspell/suggestmgr.cxx lib/hunspell/affixmgr.cxx lib/hunspell/hashmgr.cxx lib/hunspell/hunzip.cxx lib/hunspell/replist.cxx
	emcc $(EMCCFLAGS) -O3 -o wasm/$(PROJ).js -I src $^

.PHONY: clean
clean:
	rm -f wasm/$(PROJ).js wasm/$(PROJ).wasm
