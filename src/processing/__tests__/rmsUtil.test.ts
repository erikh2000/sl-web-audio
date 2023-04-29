import { calcRmsForSamples, calcRmsForSamplesInRange, calcRmsChunksFromSamples, combineRmsPair, estimateAveragePeakAmplitudeFromRms } from '../rmsUtil';

describe('rmsUtil', () => {
  describe('calcRmsForSamples()', () => {
    it('returns 0 for empty samples', () => {
      expect(calcRmsForSamples(new Float32Array([]))).toBe(0);
    });

    it('returns 0 for all 0 samples', () => {
      expect(calcRmsForSamples(new Float32Array([0, 0, 0, 0]))).toBe(0);
    });

    it('returns 0.5 for all 0.5 samples', () => {
      expect(calcRmsForSamples(new Float32Array([0.5, 0.5, 0.5, 0.5]))).toBe(0.5);
    });
  });
  
  describe('calcRmsForSamplesInRange()', () => {
    it('returns RMS for entire range of samples', () => {
      const startPos = 0, endPos = 4;
      const samples = new Float32Array([0, 0, 1, 1]);
      const expected = 0.7071067811865476;
      const rms = calcRmsForSamplesInRange(samples, startPos, endPos);
      expect(rms).toBeCloseTo(expected, 6);
    });

    it('returns RMS for starting range of samples', () => {
      const startPos = 0, endPos = 2;
      const samples = new Float32Array([0, 0, 1, 1]);
      const expected = 0;
      const rms = calcRmsForSamplesInRange(samples, startPos, endPos);
      expect(rms).toBeCloseTo(expected, 6);
    });

    it('returns RMS for ending range of samples', () => {
      const startPos = 2, endPos = 4;
      const samples = new Float32Array([0, 0, 1, 1]);
      const expected = 1;
      const rms = calcRmsForSamplesInRange(samples, startPos, endPos);
      expect(rms).toBeCloseTo(expected, 6);
    });

    it('returns RMS for middle range of samples', () => {
      const startPos = 1, endPos = 3;
      const samples = new Float32Array([0, 0, 1, 1]);
      const expected = 0.7071067811865476;
      const rms = calcRmsForSamplesInRange(samples, startPos, endPos);
      expect(rms).toBeCloseTo(expected, 6);
    });
  });
  
  describe('calcRmsChunksFromSamples()', () => {
    it('returns empty array for empty samples', () => {
      const samples = new Float32Array([]);
      const expected:number[] = [];
      const rmsChunks = calcRmsChunksFromSamples(samples, 1, 1);
      expect(rmsChunks).toEqual(expected);
    });

    it('returns single chunk for single sample', () => {
      const samples = new Float32Array([0]);
      const expected = [0];
      const rmsChunks = calcRmsChunksFromSamples(samples, 1, 1);
      expect(rmsChunks).toEqual(expected);
    });

    it('returns single chunk for two samples', () => {
      const samples = new Float32Array([1, 1]);
      const expected = [1];
      const rmsChunks = calcRmsChunksFromSamples(samples, 1, 2);
      expect(rmsChunks).toEqual(expected);
    });

    it('returns multiple chunks for multiple samples', () => {
      const samples = new Float32Array([0, 0, 1, 1]);
      const expected = [0, 1];
      const rmsChunks = calcRmsChunksFromSamples(samples, 1, 2);
      expect(rmsChunks).toEqual(expected);
    });

    it('returns smaller ending chunk when chunk size would go OOB', () => {
      const samples = new Float32Array([0, 0, 1]);
      const expected = [0, 1];
      const rmsChunks = calcRmsChunksFromSamples(samples, 1, 2);
      expect(rmsChunks).toEqual(expected);
    });

    it('uses default chunk size when unspecified in param', () => {
      const samples = new Float32Array([0, 0, 1]);
      const expected = [0, 0, 1];
      const rmsChunks = calcRmsChunksFromSamples(samples, 1);
      expect(rmsChunks).toEqual(expected);
    });
  });
  
  describe('combineRmsPair()', () => {
    it('returns RMS for an equally weighted pair of RMS values', () => {
      const rms1 = 1, firstSampleCount = 1, rms2 = 1, secondSampleCount = 1;
      const expected = 1;
      const rms = combineRmsPair(rms1, firstSampleCount, rms2, secondSampleCount);
      expect(rms).toBeCloseTo(expected, 6);
    });
  });
  
  describe('estimateAveragePeakAmplitudeFromRms()', () => {
    it('returns 0 for 0 RMS', () => {
      const rms = 0;
      const expected = 0;
      const peakAmplitude = estimateAveragePeakAmplitudeFromRms(rms);
      expect(peakAmplitude).toBeCloseTo(expected, 6);
    });
    
    it('returns expected value for 0.5 RMS', () => {
      const rms = 0.5;
      const expected = 0.44;
      const peakAmplitude = estimateAveragePeakAmplitudeFromRms(rms);
      expect(peakAmplitude).toBeCloseTo(expected, 2);
    });
  });
});