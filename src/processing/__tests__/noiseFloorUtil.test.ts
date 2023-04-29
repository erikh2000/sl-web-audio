import { findNoiseFloor } from '../noiseFloorUtil';
import { samples0, sampleRate } from '../__testWavs__/noiseFloorLowQuality';

describe('noiseFloorUtil', () => {
  describe('findNoiseFloor()', () => {
    it('throws for empty samples', () => {
      const samples = new Float32Array();
      expect(() => findNoiseFloor(samples, 10)).toThrow();
    });
    
    it('finds noise floor from low quality wav', () => {
      const noiseFloor = findNoiseFloor(samples0, sampleRate);
      
      // Execution of findNoiseFloor() is slow, so just check all expectations in one test.
      expect(noiseFloor.chunks.length).toBe(139);
      expect(noiseFloor.maxRms).toBeCloseTo(0.1433247, 6);
      expect(noiseFloor.rmsSegments.length).toBe(10);
      expect(noiseFloor.mostFrequentSegmentI).toBe(1);
      expect(noiseFloor.noiseFloorRms).toBeCloseTo(0.0270654,6);
    });
    
    it('returns lower amplitude as noise floor when 2 flat ranges are found', () => {
      const samples = new Float32Array([0, 0, 0, 0, 1.5, 1.5, 1.5, 1.5, 2, 2]);
      const noiseFloor = findNoiseFloor(samples, 4, { chunkDuration: .5, rmsSegmentCount: 10 });
      expect(noiseFloor.noiseFloorRms).toBeCloseTo(0.176, 6);
    });

    it('works with small segment count', () => {
      const samples = new Float32Array([0, 0, 0, 0, 1.5, 1.5, 1.5, 1.5, 2, 2]);
      const noiseFloor = findNoiseFloor(samples, 4, { chunkDuration: .5, rmsSegmentCount: 3 });
      expect(noiseFloor.noiseFloorRms).toBeCloseTo(0.5866666, 6);
    });

    it('throws for segment count less than 3', () => {
      const samples = new Float32Array([0, 0, 0, 0, 1.5, 1.5, 1.5, 1.5, 2, 2]);
      expect(() => findNoiseFloor(samples, 4, { chunkDuration: .5, rmsSegmentCount: 2 })).toThrow();
    });
  });
});