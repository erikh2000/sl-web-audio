import { 
  characterizeSamples, 
  combineChannelSamples, 
  mSecsToSampleCount, 
  resample, 
  sampleCountToMSecs, 
  sampleCountToTime, 
  samplesToJs,
  samplesToPcmData,
  timeToSampleCount 
} from "../sampleUtil";

describe('sampleUtil', () => {
  describe('timeToSampleCount()', () => {
    it('returns 0 for 0 time', () => {
      expect(timeToSampleCount(0, 44100)).toBe(0);
    });

    it('returns 44100 for 1 second', () => {
      expect(timeToSampleCount(1, 44100)).toBe(44100);
    });

    it('returns 22050 for 0.5 seconds', () => {
      expect(timeToSampleCount(0.5, 44100)).toBe(22050);
    });
  });
  
  describe('sampleCountToTime()', () => {
    it('returns 0 for 0 samples', () => {
      expect(sampleCountToTime(0, 44100)).toBe(0);
    });

    it('returns 1 for 44100 samples', () => {
      expect(sampleCountToTime(44100, 44100)).toBe(1);
    });

    it('returns 0.5 for 22050 samples', () => {
      expect(sampleCountToTime(22050, 44100)).toBe(0.5);
    });
  });
  
  describe('sampleCountToMSecs()', () => {
    it('returns 0 for 0 samples', () => {
      expect(sampleCountToMSecs(0, 44100)).toBe(0);
    });

    it('returns 1000 for 44100 samples', () => {
      expect(sampleCountToMSecs(44100, 44100)).toBe(1000);
    });

    it('returns 500 for 22050 samples', () => {
      expect(sampleCountToMSecs(22050, 44100)).toBe(500);
    });
  });
  
  describe('msecsToSampleCount()', () => {  
    it('returns 0 for 0 msecs', () => {
      expect(mSecsToSampleCount(0, 44100)).toBe(0);
    });

    it('returns 44100 for 1 second', () => {
      expect(mSecsToSampleCount(1000, 44100)).toBe(44100);
    });

    it('returns 22050 for 0.5 seconds', () => {
      expect(mSecsToSampleCount(500, 44100)).toBe(22050);
    });
  });
  
  describe('samplesToJs()', () => {
    it('returns correct string for 2 samples', () => {
      expect(samplesToJs(new Float32Array([0, 1]))).toBe('export const samples = [0,1];\n');
    });
  });
  
  describe('characterizeSamples()', () => {
    it('returns correct values for 2 samples', () => {
      expect(characterizeSamples(new Float32Array([0, 1]))).toEqual({
        minValue: 0,
        maxValue: 1,
        averageValue: 0.5,
        zeroCount: 1,
        sampleCount: 2,
      });
    });

    it('returns correct maximum for samples with multiple peaks', () => {
      const characterization = characterizeSamples(new Float32Array([0, 2, 0, 3, 0, -1]));
      expect(characterization.maxValue).toBe(3);
    });

    it('returns correct minimum for samples with multiple valleys', () => {
      const characterization = characterizeSamples(new Float32Array([0, -2, 0, -1, 0, -4]));
      expect(characterization.minValue).toBe(-4);
    });
  });
  
  describe('combineChannelSamples()', () => {
    it('returns same samples for one channel', () => {
      const channelOSamples = new Float32Array([0, 1]);
      const channelSamples = [channelOSamples];
      const expected = new Float32Array([0, 1]);
      const combinedSamples = combineChannelSamples(channelSamples);
      expect(combinedSamples).toEqual(expected);
    });

    it('returns averaged samples for two channels', () => {
      const channelOSamples = new Float32Array([0, 1, -2]);
      const channel1Samples = new Float32Array([2, 1, 0]);
      const channelSamples = [channelOSamples, channel1Samples];
      const expected = new Float32Array([1, 1, -1]);
      const combinedSamples = combineChannelSamples(channelSamples);
      expect(combinedSamples).toEqual(expected);
    });
  });
  
  describe('resample()', () => {
    it('returns same samples for same sample rate', () => {
      const samples = new Float32Array([0, 1]);
      const resampledSamples = resample(samples, 44100, 44100);
      expect(resampledSamples).toEqual(samples);
    });

    it('resamples to a higher sample rate', () => {
      const samples = new Float32Array([0, 1]);
      const expected = new Float32Array([0, .5, 1, 1]);
      const resampledSamples = resample(samples, 44100, 88200);
      expect(resampledSamples).toEqual(expected);
    });
    
    it('resamples to a lower sample rate', () => {
      const samples = new Float32Array([0, 1, 0, 1]);
      const expected = new Float32Array([0, 0]);
      const resampledSamples = resample(samples, 44100, 22050);
      expect(resampledSamples).toEqual(expected);
    });
  });
  
  describe('samplesToPcmData()', () => {
    it('returns empty array when passed empty samples', () => {
      const samples = new Float32Array([]);
      const expected = new Uint8Array([]);
      const pcmData = samplesToPcmData(samples);
      expect(pcmData).toEqual(expected);
    });
    
    it('returns correct pcm data for 2 samples', () => {
      const samples = new Float32Array([-1, 1]);
      const expected = new Uint8Array([1, 128, 255, 127]);
      const pcmData = samplesToPcmData(samples);
      expect(pcmData).toEqual(expected);
    });
  });
});