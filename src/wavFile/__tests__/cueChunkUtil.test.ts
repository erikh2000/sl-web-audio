import { encodeWispCueChunk, parseCuesFromCueChunkData } from '../cueChunkUtil';
import WavCue from "../WavCue";
import {WISP_SAMPLE_RATE} from "../wispFormatConstants";

describe('cueChunkUtil', () => {
  describe('encodeWispCueChunk()', () => {
    it('returns an empty array if no cues', () => {
      const cues:WavCue[] = [];
      const expected = new Uint8Array([]);
      const chunk = encodeWispCueChunk(cues);
      expect(chunk).toEqual(expected);
    });
    
    it('encodes a WISP cue chunk', () => {
      const cues = [
        {position: 0, label: 'zero'},
        {position: 1, label: 'one'},
        {position: 2, label: 'two'}
      ];
      const expected = new Uint8Array([
        99, 117, 101, 32,                 // "cue "
        76, 0, 0, 0,                      // chunk data size 
        3, 0, 0, 0,                       // number of cues
        1, 0, 0, 0,                       // cue 1 ID   
        0, 0, 0, 0,                       // cue 1 position
        100,  97, 116, 97,                // cue 1 data chunk ID
        0, 0, 0, 0,                       // cue 1 chunk start
        0, 0, 0, 0,                       // cue 1 block start
        0, 0, 0, 0,                       // cue 1 sample offset
        2, 0, 0, 0,                       // cue 2 ID   
        0, 0, 0, 0,                       // cue 2 position
        100,  97, 116, 97,                // cue 2 data chunk ID
        0, 0, 0, 0,                       // cue 2 chunk start
        0, 0, 0, 0,                       // cue 2 block start
        68, 172, 0, 0,                    // cue 2 sample offset
        3, 0, 0, 0,                       // cue 3 ID   
        0, 0, 0, 0,                       // cue 3 position
        100,  97, 116, 97,                // cue 3 data chunk ID
        0, 0, 0, 0,                       // cue 3 chunk start
        0, 0, 0, 0,                       // cue 3 block start
        136, 88, 1, 0                     // cue 3 sample offset
      ]);
      const chunk = encodeWispCueChunk(cues);
      expect(chunk).toEqual(expected);
    });
  });
  
  describe('parseCuesFromCueChunkData()', () => {
    it('parses cues from cue chunk data', () => {
      const cueChunkData = new Uint8Array([
        3, 0, 0, 0,                       // number of cues
        1, 0, 0, 0,                       // cue 1 ID   
        0, 0, 0, 0,                       // cue 1 position
        100,  97, 116, 97,                // cue 1 data chunk ID
        0, 0, 0, 0,                       // cue 1 chunk start
        0, 0, 0, 0,                       // cue 1 block start
        0, 0, 0, 0,                       // cue 1 sample offset
        2, 0, 0, 0,                       // cue 2 ID   
        0, 0, 0, 0,                       // cue 2 position
        100,  97, 116, 97,                // cue 2 data chunk ID
        0, 0, 0, 0,                       // cue 2 chunk start
        0, 0, 0, 0,                       // cue 2 block start
        68, 172, 0, 0,                    // cue 2 sample offset
        3, 0, 0, 0,                       // cue 3 ID   
        0, 0, 0, 0,                       // cue 3 position
        100,  97, 116, 97,                // cue 3 data chunk ID
        0, 0, 0, 0,                       // cue 3 chunk start
        0, 0, 0, 0,                       // cue 3 block start
        136, 88, 1, 0                     // cue 3 sample offset
      ]);
      const expected = [
        {position: 0, label: ''},
        {position: 1, label: ''},
        {position: 2, label: ''}
      ];
      const cues = parseCuesFromCueChunkData(cueChunkData, WISP_SAMPLE_RATE);
      expect(cues).toEqual(expected);
    });
    
  });
});