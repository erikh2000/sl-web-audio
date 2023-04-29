/* General-purpose functions for working with RIFF files. There's quite a bit of code in wavUtil.ts that seems
   like it should go here, but is actually coupled to the WISP-specific use of the RIFF/WAVE format. Rather than
   writing an extra layer of abstraction here, I'd rather just move any general-purpose functions and make peace
   with the WISP-specific coupling elsewhere - it's an efficient way to write the code, and I don't aim to
   write a big utility library here. */

import WavCue from "./WavCue";
import {sampleCountToTime} from "../processing/sampleUtil";

const CHUNK_SIZE_OFFSET = 4;
const CHUNK_DATA_OFFSET = 8;

function _readUint32(bytes:Uint8Array, offset:number):number {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] << 24);
}

function _readNullTerminatedAscii(bytes:Uint8Array, offset:number, maxLength:number):string {
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
    const chunkDataSize = _readUint32(wavBytes, readI + CHUNK_SIZE_OFFSET)
    if (_doesChunkIdMatch()) return _copyChunkData(chunkDataSize);
    readI += CHUNK_DATA_OFFSET + chunkDataSize;
  }
  return null;
}

export function parseCuesFromCueChunkData(cueChunkData:Uint8Array, sampleRate:number):WavCue[] {
  const CUE_POINT_OFFSET = 4;
  const CUE_POINT_DATA_SIZE = 24;
  const SAMPLE_OFFSET = 20;
  const cueCount = _readUint32(cueChunkData, 0);
  const cues:WavCue[] = [];
  for (let cueI = 0; cueI < cueCount; ++cueI) {
    const sampleOffsetI = CUE_POINT_OFFSET + (cueI * CUE_POINT_DATA_SIZE) + SAMPLE_OFFSET;
    const sampleOffset = _readUint32(cueChunkData, sampleOffsetI);
    const position = sampleCountToTime(sampleOffset, sampleRate);
    cues.push({ position, label:'' });
  }
  return cues;
}

export function parseLabelsFromAdtlChunkData(adtlChunkData:Uint8Array):string[] {
  const SUB_CHUNK_HEADER_SIZE = 8;
  const labels:string[] = [];
  const chunkDataSize = adtlChunkData.length;
  let readI = 4; // Skip over "adtl" chunk ID.
  while(readI < chunkDataSize) {
    const subChunkId = _readUint32(adtlChunkData, readI);
    const subChunkDataSize = _readUint32(adtlChunkData, readI + 4);
    if (subChunkId === 0x6c626c20) { // "labl"
      const label = _readNullTerminatedAscii(adtlChunkData, readI + SUB_CHUNK_HEADER_SIZE, subChunkDataSize);
      labels.push(label);
    }
    readI += SUB_CHUNK_HEADER_SIZE + subChunkDataSize;
  }
  return labels;
}

export function encodeRiffWaveHeader(chunksDataSize:number):Uint8Array {
  const header = new Uint8Array(12);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF" - This is actually the file header, and not part of the root chunk, but... it's fine.
  view.setUint32(4, chunksDataSize, true); // Size of all the other chunks and this one, excluding the first 8 bytes.
  view.setUint32(8, 0x57415645, false); // "WAVE"
  return header;
}
