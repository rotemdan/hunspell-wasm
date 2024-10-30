export declare function encodeUtf8(text: string): Uint8Array;
export declare function decodeUtf8(buffer: Uint8Array): string;
export declare class ChunkedUtf8Decoder {
    private str;
    private readonly textDecoder;
    writeChunk(chunk: Uint8Array): void;
    toString(): string;
}
