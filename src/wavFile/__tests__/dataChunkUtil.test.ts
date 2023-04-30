import { encodeWispDataChunk } from "../dataChunkUtil";

describe('dataChunkUtil', () => {
  describe('encodeWispDataChunk()', () => {
    it('encodes a WISP data chunk', () => {
      const samples = new Float32Array([0, 0.5, 1]);
      const expected = new Uint8Array([
        100, 97, 116, 97,       // "data" 
        6,  0, 0, 0,            // chunk data size 
        0,  0, 0, 64, 255, 127  // PCM sample data
      ]);
      const chunk = encodeWispDataChunk(samples);
      expect(chunk).toEqual(expected);
    });
  });
});