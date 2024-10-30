import { TypedArray, TypedArrayConstructor } from "./TypedArray.js"

export function concatUint8Arrays(arrays: Uint8Array[]) {
	return concatTypedArrays<Uint8Array>(Uint8Array, arrays)
}

function concatTypedArrays<T extends TypedArray>(TypedArrayConstructor: TypedArrayConstructor<T>, arrays: T[]) {
	let totalLength = 0

	for (const array of arrays) {
		totalLength += array.length
	}

	const result = new TypedArrayConstructor(totalLength)

	let writeOffset = 0

	for (const array of arrays) {
		result.set(array, writeOffset)

		writeOffset += array.length
	}

	return result as T
}

export function getRandomId() {
	return Math.random().toString().substring(2)
}
