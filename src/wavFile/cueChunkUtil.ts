import WavCue from "./WavCue";
import {WISP_SAMPLE_RATE} from "./wispFormatConstants";
import {sampleCountToTime, timeToSampleCount} from "../processing/sampleUtil";
import {readUint32LE} from "./riffUtil";

export function encodeWispCueChunk(cues:WavCue[]):Uint8Array {
  if (!cues.length) return new Uint8Array(0);

  const cueCount = cues.length;
  const chunk = new Uint8Array(12 + 24 * cueCount);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x63756520, false); // "cue "
  view.setUint32(4, 4 + 24 * cueCount, true); // Chunk size, excluding this header.
  view.setUint32(8, cueCount, true); // Cue count

  let writePos = 12;
  for(let i = 0; i < cueCount; ++i) {
    const sampleOffset = timeToSampleCount(cues[i].position, WISP_SAMPLE_RATE);
    view.setUint32(writePos, i + 1, true); writePos += 4; // Cue point ID
    view.setUint32(writePos, 0, true); writePos += 4; // Position - ignored because not using playlist.
    view.setUint32(writePos, 0x64617461, false); writePos += 4; // Data chunk ID
    view.setUint32(writePos, 0, true); writePos += 4; // Chunk start - ignored because there is only one data chunk.
    view.setUint32(writePos, 0, true); writePos += 4; // Block start - ignored because data is not compressed.
    view.setUint32(writePos, sampleOffset, true); writePos += 4; // Sample offset
  }

  return chunk;
}

export function parseCuesFromCueChunkData(cueChunkData:Uint8Array, sampleRate:number):WavCue[] {
  const CUE_POINT_OFFSET = 4;
  const CUE_POINT_DATA_SIZE = 24;
  const SAMPLE_OFFSET = 20;
  const cueCount = readUint32LE(cueChunkData, 0);
  const cues:WavCue[] = [];
  for (let cueI = 0; cueI < cueCount; ++cueI) {
    const sampleOffsetI = CUE_POINT_OFFSET + (cueI * CUE_POINT_DATA_SIZE) + SAMPLE_OFFSET;
    const sampleOffset = readUint32LE(cueChunkData, sampleOffsetI);
    const position = sampleCountToTime(sampleOffset, sampleRate);
    cues.push({ position, label:'' });
  }
  return cues;
}