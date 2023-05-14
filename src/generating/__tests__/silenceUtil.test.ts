import {createSilenceSamples, appendSilenceSamples} from '../silenceUtil';

describe('silenceUtil', () => {
  describe('createSilenceSamples', () => {
    it('creates silence samples', () => {
      const samples = createSilenceSamples(44100, 100);
      expect(samples.length).toBe(4410);
      expect(samples[0]).toBe(0);
      expect(samples[4409]).toBe(0);
    });
    
    it('creates silence samples with a different sample rate', () => {
      const samples = createSilenceSamples(22050, 100);
      expect(samples.length).toBe(2205);
      expect(samples[0]).toBe(0);
      expect(samples[2204]).toBe(0);
    });
  });
  
  describe('appendSilenceSamples', () => {
    it('appends silence samples to an empty array', () => {
      const samples = new Float32Array(0);
      const appendedSamples = appendSilenceSamples(samples, 44100, 100);
      expect(appendedSamples.length).toBe(4410);
      expect(appendedSamples[0]).toBe(0);
      expect(appendedSamples[4409]).toBe(0);
    });
    
    it('appends silence samples', () => {
      const samples = new Float32Array(44100);
      samples[0] = 1;
      samples[44099] = 2;
      const appendedSamples = appendSilenceSamples(samples, 44100, 100);
      expect(appendedSamples.length).toBe(44100+4410);
      expect(appendedSamples[0]).toBe(1);
      expect(appendedSamples[44099]).toBe(2);
      expect(appendedSamples[44100]).toBe(0);
      expect(appendedSamples[44100+4410-1]).toBe(0);
    });
    
    it('appends no silence samples when the silence duration is 0', () => {
      const samples = new Float32Array(44100);
      samples[0] = 1;
      samples[44099] = 2;
      const appendedSamples = appendSilenceSamples(samples, 44100, 0);
      expect(appendedSamples.length).toBe(44100);
      expect(appendedSamples[0]).toBe(1);
      expect(appendedSamples[44099]).toBe(2);
    });
  });
});