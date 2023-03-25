import { findMaxPeakInSampleRange, findMaxPeakInSamples } from "../peakUtil";

describe("peakUtil", () => {
  describe("findMaxPeakInSampleRange()", () => {
    it("returns 0 for empty array", () => {
      expect(findMaxPeakInSampleRange(new Float32Array(), 0, 0)).toEqual(0);
    });
    
    it('returns 0 for empty range', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([1, 2, 3]), 0, 0)).toEqual(0);
    });
    
    it('returns 0 for range past end of array', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([1, 2, 3]), 3, 4)).toEqual(0);
    });
    
    it('returns 0 for range before start of array', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([1, 2, 3]), -1, 0)).toEqual(0);
    });
    
    it('returns maximum peak in range', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([1, 2, 3]), 0, 3)).toEqual(3);
    });
    
    it('returns high negative sample as positive peak', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([-1, -2, -3]), 0, 3)).toEqual(3);
    });
    
    it('returns maximum peak for range that extends past end of array', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([1, 2, 3]), 0, 4)).toEqual(3);
    });
    
    it('returns maximum peak for range that extends before start of array', () => {
      expect(findMaxPeakInSampleRange(new Float32Array([1, 2, 3]), -1, 3)).toEqual(3);
    });
  });
  
  describe('findMaxPeakInSamples()', () => {
    it('returns 0 for empty array', () => {
      expect(findMaxPeakInSamples(new Float32Array())).toEqual(0);
    });
    
    it('returns maximum peak in array', () => {
      expect(findMaxPeakInSamples(new Float32Array([1, 2, 3]))).toEqual(3);
    });
    
    it('returns high negative sample as positive peak', () => {
      expect(findMaxPeakInSamples(new Float32Array([-1, -2, -3]))).toEqual(3);
    });
  });
    
});