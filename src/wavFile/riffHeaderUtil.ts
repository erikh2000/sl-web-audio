export function encodeRiffWaveHeader(chunksDataSize:number):Uint8Array {
  const header = new Uint8Array(12);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, chunksDataSize, true); // Size of all the other chunks and this one, excluding the first 8 bytes.
  view.setUint32(8, 0x57415645, false); // "WAVE"
  return header;
}