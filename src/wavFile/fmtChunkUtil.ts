import {WISP_BIT_DEPTH, WISP_BYTES_PER_SAMPLE, WISP_CHANNEL_COUNT, WISP_SAMPLE_RATE} from "./wispFormatConstants";

const WAVE_FORMAT_PCM = 1;
export function encodeWispFmtChunk():Uint8Array {
  const chunk = new Uint8Array(24);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x666d7420, false); // "fmt "
  view.setUint32(4, 16, true); // Chunk size, excluding this header.
  view.setUint16(8, WAVE_FORMAT_PCM, true); // Format code
  view.setUint16(10, WISP_CHANNEL_COUNT, true); // Channel count - always mono for WISP.
  view.setUint32(12, WISP_SAMPLE_RATE, true); // Sample rate
  view.setUint32(16, WISP_SAMPLE_RATE * WISP_BYTES_PER_SAMPLE, true); // Byte rate
  view.setUint16(20, WISP_BYTES_PER_SAMPLE, true); // Block align
  view.setUint16(22, WISP_BIT_DEPTH, true); // Bits per sample

  return chunk;
}