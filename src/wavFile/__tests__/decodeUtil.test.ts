import { wavBytesToAudioBuffer, wavBytesToAudioBufferAndCues } from '../decodeUtil';
import { wavBytes as withNoCuesWavBytes } from '../__testWavs__/wavWithNoCuesBytes';
import { wavBytes as withCuesWavBytes } from '../__testWavs__/wavWithCuesBytes';
import { wavBytes as withCuesNoAdtlWavBytes } from '../__testWavs__/wavWithCuesNoAdtlBytes';
import * as theAudioContextModule from '../../common/theAudioContext';
import { theAudioContextMock, theAudioContextUnavailableMock } from '../__mocks__/theAudioContextMock';

describe('decodeUtil', () => {
  beforeEach(() => {
    jest.mock('../../common/theAudioContext');
    jest.spyOn(theAudioContextModule, 'theAudioContext').mockImplementation(theAudioContextMock);
  });
  
  describe('wavBytesToAudioBuffer', () => {
    it('returns AudioBuffer from wav bytes', async () => {
      const audioBuffer = await wavBytesToAudioBuffer(withCuesWavBytes);
      expect(audioBuffer.getChannelData(0).length).toEqual(audioBuffer.length);
    });
    
    it('throws if AudioContext is unavailable', async () => {
      jest.spyOn(theAudioContextModule, 'theAudioContext').mockImplementation(theAudioContextUnavailableMock);
      await expect(wavBytesToAudioBuffer(withCuesWavBytes)).rejects.toThrow('AudioContext not available');
    });
  });
  
  describe('wavBytesToAudioBufferAndCues', () => {
    it('returns AudioBuffer and cues from wav bytes', async () => {
      const [audioBuffer, cues] = await wavBytesToAudioBufferAndCues(withCuesWavBytes);
      expect(audioBuffer.getChannelData(0).length).toEqual(audioBuffer.length);
      expect(cues.length).toEqual(4);
      expect(cues[0].label !== '');
      expect(cues[1].label !== '');
      expect(cues[2].label !== '');
      expect(cues[3].label !== '');
    });

    it('returns AudioBuffer and cues without labels from wav bytes', async () => {
      const [audioBuffer, cues] = await wavBytesToAudioBufferAndCues(withCuesNoAdtlWavBytes);
      expect(audioBuffer.getChannelData(0).length).toEqual(audioBuffer.length);
      expect(cues.length).toEqual(4);
      expect(cues[0].label === '');
      expect(cues[1].label === '');
      expect(cues[2].label === '');
      expect(cues[3].label === '');
    });
    
    it('returns AudioBuffer and empty array of cues from wav bytes missing cues', async () => {
      const [audioBuffer, cues] = await wavBytesToAudioBufferAndCues(withNoCuesWavBytes);
      expect(audioBuffer.getChannelData(0).length).toEqual(audioBuffer.length);
      expect(cues.length).toEqual(0);
    });
  });
});