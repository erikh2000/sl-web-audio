import { encodeRiffWaveHeader } from "../riffHeaderUtil";

describe("encodeRiffWaveHeader", () => {
  describe('encodeRiffWaveHeader()', () => {
    it('encodes a RIFF WAVE header', () => {
      const expected = new Uint8Array([
        82, 73, 70, 70,   // "RIFF" 
        232, 3,  0,  0,   // Size of all the other chunks and this one, excluding the first 8 bytes.
        87,  65, 86, 69   // "WAVE"
      ]);
      const header = encodeRiffWaveHeader(1000);
      expect(header).toEqual(expected);
    });
  });
});