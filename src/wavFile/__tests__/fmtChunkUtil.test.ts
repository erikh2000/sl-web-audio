import { encodeWispFmtChunk } from "../fmtChunkUtil";

describe('fmtChunkUtil', () => {
  describe('encodeWispFmtChunk()', () => {
    it('encodes a WISP fmt chunk', () => {
      const expected = new Uint8Array([
        102, 109, 116, 32,  // "fmt "
        16, 0, 0, 0,        // Size of the fmt chunk, excluding the first 8 bytes.
        1, 0,               // Format (1 = PCM)
        1, 0,               // Number of channels
        68, 172, 0, 0,      // Sample rate (48000)
        136, 88, 1, 0,      // Byte rate (48000 * 2 * 2)
        2, 0,               // Block align
        16, 0               // Bits per sample
      ]);
      const chunk = encodeWispFmtChunk();
      expect(chunk).toEqual(expected);
    });
  });
});