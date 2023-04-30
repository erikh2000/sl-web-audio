import WavCue from "./WavCue";
import {readChunkId, readNullTerminatedAscii, readUint32LE, textToNullTerminatedAscii} from "./riffUtil";

export function encodeWispAdtlChunk(cues:WavCue[]):Uint8Array {
  if (!cues.length) return new Uint8Array(0);

  const cueCount = cues.length;
  const combinedLabelLength = cues.reduce((sum, cue) => sum + cue.label.length + 1, 0);
  let chunkSize = 4 + (12 * cueCount) + combinedLabelLength;
  chunkSize += chunkSize % 2; // Pad to even number of bytes.
  const chunk = new Uint8Array(8 + chunkSize);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x6c697374, false); // "list"
  view.setUint32(4, chunkSize, true); // Chunk size, excluding this header.
  view.setUint32(8, 0x6164746c, false); // "adtl"

  let writePos = 12;
  for(let i = 0; i < cueCount; ++i) {
    view.setUint32(writePos, 0x6c61626c, false); writePos += 4; // "labl"
    view.setUint32(writePos, 4 + cues[i].label.length + 1, true); writePos += 4; // Chunk data size, excluding this header.
    view.setUint32(writePos, i+1, true); writePos += 4; // Cue point ID
    const szLabel = textToNullTerminatedAscii(cues[i].label)
    chunk.set(szLabel, writePos); writePos += szLabel.length;
  }

  return chunk;
}

export function parseLabelsFromAdtlChunkData(adtlChunkData:Uint8Array):string[] {
  const SUB_CHUNK_LABEL_OFFSET = 12;
  const SUB_CHUNK_HEADER_SIZE = 8;
  const labels:string[] = [];
  const chunkDataSize = adtlChunkData.length;
  let readI = 4; // Skip over "adtl" chunk ID.
  while(readI < chunkDataSize) {
    const subChunkId = readChunkId(adtlChunkData, readI);
    const subChunkDataSize = readUint32LE(adtlChunkData, readI + 4);
    if (subChunkId === 'labl') {
      const maxLabelLength = subChunkDataSize - 4;
      const label = readNullTerminatedAscii(adtlChunkData, readI + SUB_CHUNK_LABEL_OFFSET, maxLabelLength);
      labels.push(label);
    }
    readI += SUB_CHUNK_HEADER_SIZE + subChunkDataSize;
  }
  return labels;
}