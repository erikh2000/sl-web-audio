import {samplesToPcmData} from "../processing/sampleUtil";
import {WISP_BYTES_PER_SAMPLE} from "./wispFormatConstants";

export function encodeWispDataChunk(samples:Float32Array):Uint8Array {
  const pcmData = samplesToPcmData(samples);
  const chunk = new Uint8Array(8 + pcmData.length);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x64617461, false); // "data"
  view.setUint32(4, samples.length * WISP_BYTES_PER_SAMPLE, true); // Chunk size, excluding this header.
  chunk.set(pcmData, 8);

  return chunk;
}