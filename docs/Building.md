# Building the Hunspell WebAssembly module

**Note**: Emscripten is only likely to work correctly on Linux (or possibly macOS). Use WSL if on Windows.

Clone the EMSDK repository:
```
git clone https://github.com/emscripten-core/emsdk
```

Install and activate EMSDK:
```
cd emsdk
git pull
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..
```

Clone [`hunspell-wasm` repository](https://github.com/rotemdan/hunspell-wasm):
```
git clone https://github.com/rotemdan/hunspell-wasm
```

Enter directory and build:
```
cd hunspell-wasm
npm install
make clean
make
```

Output files:
```
wasm/hunspell.js
wasm/hunspell.wasm
```
