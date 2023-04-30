/* General-purpose functions for working with RIFF files. No WISP business logic or format assumptions. */

const CHUNK_SIZE_OFFSET = 4;
const CHUNK_DATA_OFFSET = 8;

// Decodes a 32-bit little endian unsigned integer from the given byte array at the given offset.
export function readUint32LE(bytes:Uint8Array, offset:number):number {
  const value = bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] << 24);
  return value >>> 0; // Convert to unsigned.
}

export function readChunkId(bytes:Uint8Array, offset:number):string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

export function readNullTerminatedAscii(bytes:Uint8Array, offset:number, maxLength:number):string {
  let text = '';
  for (let i = 0; i < maxLength; ++i) {
    const byte = bytes[offset+i];
    if (byte === 0) break;
    text += String.fromCharCode(byte);
  }
  return text;
}

export function textToNullTerminatedAscii(text:string):Uint8Array {
  const textBytes = new TextEncoder().encode(text);
  const nullTerminatedTextBytes = new Uint8Array(textBytes.length + 1); // +1 for null terminator
  nullTerminatedTextBytes.set(textBytes); // Default value is 0, so null terminator is already there.
  return nullTerminatedTextBytes;
}

// Find first chunk inside RIFF matching chunkId and return chunk data bytes for it or null if not found.
export function findWavChunk(wavBytes:Uint8Array, chunkId:string):Uint8Array|null {
  const chunkIdBytes = new TextEncoder().encode(chunkId);
  const wavBytesLen = wavBytes.length;

  const _doesChunkIdMatch = () => {
    return wavBytes[readI] === chunkIdBytes[0] && wavBytes[readI + 1] === chunkIdBytes[1] &&
      wavBytes[readI + 2] === chunkIdBytes[2] && wavBytes[readI + 3] === chunkIdBytes[3];
  }

  const _copyChunkData = (chunkDataSize:number):Uint8Array => {
    return wavBytes.subarray(readI + CHUNK_DATA_OFFSET, readI + CHUNK_DATA_OFFSET + chunkDataSize);
  }

  let readI = 12; // Skip to position in data after RIFF header.
  while (readI < wavBytesLen) {
    const chunkDataSize = readUint32LE(wavBytes, readI + CHUNK_SIZE_OFFSET)
    if (_doesChunkIdMatch()) return _copyChunkData(chunkDataSize);
    readI += CHUNK_DATA_OFFSET + chunkDataSize;
  }
  return null;
}
