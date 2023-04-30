import { audioBufferToWavBytes, audioBufferAndCuesToWavBytes, samplesToWavBytes, wavBytesToJs } from '../encodeUtil';
import {findWavChunk} from "../riffUtil";
import WavCue from "../WavCue";

describe('encodeUtil', () => {
  describe('samplesToWavBytes', () => {
    it('returns wav bytes from samples', () => {
      const samples = new Float32Array(100);
      const wavBytes = samplesToWavBytes(samples, 44100);
      expect(findWavChunk(wavBytes, 'fmt ')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'data')).toBeTruthy();
    });

    it('returns wav bytes from samples with non-WISP sample rate', () => {
      const samples = new Float32Array(100);
      const wavBytes = samplesToWavBytes(samples, 22050);
      expect(findWavChunk(wavBytes, 'fmt ')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'data')).toBeTruthy();
    });
  });
  
  describe('audioBufferToWavBytes', () => {
    it('returns wav bytes from audio buffer', () => {
      const audioBuffer:unknown = {
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(100),
      };
      const wavBytes = audioBufferToWavBytes(audioBuffer as AudioBuffer);
      expect(findWavChunk(wavBytes, 'fmt ')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'data')).toBeTruthy();
    });

    it('returns wav bytes from audio buffer with non-WISP sample rate', () => {
      const audioBuffer:unknown = {
        numberOfChannels: 1,
        sampleRate: 22050,
        getChannelData: () => new Float32Array(100),
      };
      const wavBytes = audioBufferToWavBytes(audioBuffer as AudioBuffer);
      expect(findWavChunk(wavBytes, 'fmt ')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'data')).toBeTruthy();
    });
  });

  describe('audioBufferAndCuesToWavBytes', () => {
    it('returns wav bytes from audio buffer', () => {
      const audioBuffer:unknown = {
        numberOfChannels: 1,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(100),
      };
      const cues:WavCue[] = [{position: 0, label: 'test'}];
      const wavBytes = audioBufferAndCuesToWavBytes(audioBuffer as AudioBuffer, cues);
      expect(findWavChunk(wavBytes, 'fmt ')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'data')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'cue ')).toBeTruthy();
      expect(findWavChunk(wavBytes, 'list')).toBeTruthy();
    });
  });
  
  describe('wavBytesToJs', () => {
    it('returns js object from wav bytes', () => {
      const samples = new Float32Array(100);
      const wavBytes = samplesToWavBytes(samples, 44100);
      const wavJs = wavBytesToJs(wavBytes);
      expect(wavJs).toBeTruthy();
    });
  });
});