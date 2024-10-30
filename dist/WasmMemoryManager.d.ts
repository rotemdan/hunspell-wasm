import { TypedArray } from './TypedArray.js';
export declare class WasmMemoryManager {
    wasmModule: any;
    private wasmAlloc;
    private wasmFree;
    private allocatedReferences;
    constructor(wasmModule: any, options?: WasmMemoryManagerOptions);
    allocInt8(): Int8Ref;
    wrapInt8(address: number): Int8Ref;
    allocUint8(): Uint8Ref;
    wrapUint8(address: number): Uint8Ref;
    allocInt16(): Int16Ref;
    wrapInt16(address: number): Int16Ref;
    allocUint16(): Uint16Ref;
    wrapUint16(address: number): Uint16Ref;
    allocInt32(): Int32Ref;
    wrapInt32(address: number): Int32Ref;
    allocUint32(): Uint32Ref;
    wrapUint32(address: number): Uint32Ref;
    allocPointer(): PointerRef;
    wrapPointer(address: number): PointerRef;
    allocFloat32(): Float64Ref;
    wrapFloat32(address: number): Float32Ref;
    allocFloat64(): Float64Ref;
    wrapFloat64(address: number): Float64Ref;
    allocInt8Array(length: number): Int8ArrayRef;
    wrapInt8Array(address: number, length: number): Int8ArrayRef;
    allocUint8Array(length: number): Uint8ArrayRef;
    wrapUint8Array(address: number, length: number): Uint8ArrayRef;
    allocInt16Array(length: number): Int16ArrayRef;
    wrapInt16Array(address: number, length: number): Int16ArrayRef;
    allocUint16Array(length: number): Uint16ArrayRef;
    wrapUint16Array(address: number, length: number): Uint16ArrayRef;
    allocInt32Array(length: number): Int32ArrayRef;
    wrapInt32Array(address: number, length: number): Int32ArrayRef;
    allocUint32Array(length: number): Uint32ArrayRef;
    wrapUint32Array(address: number, length: number): Uint32ArrayRef;
    allocFloat32Array(length: number): Float32ArrayRef;
    wrapFloat32Array(address: number, length: number): Float32ArrayRef;
    allocFloat64Array(length: number): Float64ArrayRef;
    wrapFloat64Array(address: number, length: number): Float64ArrayRef;
    allocNullTerminatedUtf8String(str: string): Uint8ArrayRef;
    wrapNullTerminatedUtf8String(address: number): NullTerminatedUtf8StringRef;
    private alloc;
    free(wasmReference: WasmRef): void;
    freeAll(): void;
    detach<T extends WasmRef>(wasmReference: T): T;
}
declare abstract class ValueRef<T extends number | string> {
    protected ptr: number;
    private readonly manager;
    protected get module(): any;
    constructor(ptr: number, manager: WasmMemoryManager);
    get value(): T;
    set value(newValue: T);
    abstract getValue(): T;
    abstract setValue(newValue: T): void;
    get address(): number;
    clear(): this;
    free(): void;
    detach(): this;
    clearAddress(): void;
    get isFreed(): boolean;
    protected assertNotFreed(): void;
}
export declare class Int8Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class Uint8Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class Int16Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class Uint16Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class Int32Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class Uint32Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class PointerRef extends Uint32Ref {
}
export declare class Float32Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class Float64Ref extends ValueRef<number> {
    getValue(): number;
    setValue(newValue: number): void;
}
export declare class NullTerminatedUtf8StringRef extends ValueRef<string> {
    getValue(): string;
    setValue(newValue: string): void;
}
declare abstract class TypedArrayRef<T extends TypedArray> {
    protected ptr: number;
    readonly length: number;
    private readonly manager;
    get module(): any;
    constructor(ptr: number, length: number, manager: WasmMemoryManager);
    get view(): T;
    protected abstract getView(): T;
    slice(start?: number, end?: number): Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
    get address(): number;
    clear(): this;
    free(): void;
    clearAddress(): void;
    detach(): this;
    get isFreed(): boolean;
    protected assertNotFreed(): void;
}
export declare class Int8ArrayRef extends TypedArrayRef<Int8Array> {
    getView(): Int8Array;
}
export declare class Uint8ArrayRef extends TypedArrayRef<Uint8Array> {
    getView(): Uint8Array;
    readAsNullTerminatedUtf8String(): string;
}
export declare class Int16ArrayRef extends TypedArrayRef<Int16Array> {
    getView(): Int16Array;
}
export declare class Uint16ArrayRef extends TypedArrayRef<Uint16Array> {
    getView(): Uint16Array;
}
export declare class Int32ArrayRef extends TypedArrayRef<Int32Array> {
    getView(): Int32Array;
}
export declare class Uint32ArrayRef extends TypedArrayRef<Uint32Array> {
    getView(): Uint32Array;
}
export declare class Float32ArrayRef extends TypedArrayRef<Float32Array> {
    getView(): Float32Array;
}
export declare class Float64ArrayRef extends TypedArrayRef<Float64Array> {
    getView(): Float64Array;
}
export type WasmRef = ValueRef<number> | ValueRef<string> | TypedArrayRef<TypedArray>;
export interface WasmMemoryManagerOptions {
    wasmAlloc?: WasmAllocMethod;
    wasmFree?: WasmFreeMethod;
}
export type WasmAllocMethod = (size: number) => number;
export type WasmFreeMethod = (address: number) => void;
export {};
