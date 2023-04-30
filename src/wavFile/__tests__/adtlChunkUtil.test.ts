import {encodeWispAdtlChunk, parseLabelsFromAdtlChunkData } from '../adtlChunkUtil';
import WavCue from "../WavCue";

describe('adtlChunkUtil', () => {
  describe('encodeWispAdtlChunk()', () => {
    it('encodes a WISP adtl chunk', () => {
      const cues:WavCue[] = [
        { position:0, label: "Cue 1" },
        { position:1, label: "Cue 2" }
      ];
      const expected = new Uint8Array([
        108, 105, 115, 116,     // "list" 
        40, 0, 0, 0,            // chunk data size 
        97, 100, 116, 108,      // "adtl"

        108, 97, 98, 108,       // Cue 1 "labl"
        10, 0, 0, 0,            // chunk data size
        1, 0, 0, 0,             // Cue point ID
        67, 117, 101, 32, 49, 0,// "Cue 1\0"

        108, 97, 98, 108,       // Cue 2 "labl"
        10, 0, 0, 0,            // chunk data size
        2, 0, 0, 0,             // Cue point ID
        67, 117, 101, 32, 50, 0 // "Cue 2\0"
      ]);
      const chunk = encodeWispAdtlChunk(cues);
      expect(chunk).toEqual(expected);
    });
    
    it('returns an empty array if no cues are provided', () => {
      const cues:WavCue[] = [];
      const expected = new Uint8Array(0);
      const chunk = encodeWispAdtlChunk(cues);
      expect(chunk).toEqual(expected);
    });
  });
  
  describe('parseLabelsFromAdtlChunkData()', () => {
    it('parses labels from a WISP adtl chunk', () => {
      const chunkData = new Uint8Array([
        97, 100, 116, 108,      // "adtl"
        
        108, 97, 98, 108,       // Cue 1 "labl"
        10, 0, 0, 0,            // chunk data size
        1, 0, 0, 0,             // Cue point ID
        67, 117, 101, 32, 49, 0,// "Cue 1\0"

        108, 97, 98, 108,       // Cue 2 "labl"
        10, 0, 0, 0,            // chunk data size
        2, 0, 0, 0,             // Cue point ID
        67, 117, 101, 32, 50, 0 // "Cue 2\0"
      ]);
      const expected = ["Cue 1", "Cue 2"];
      const labels = parseLabelsFromAdtlChunkData(chunkData);
      expect(labels).toEqual(expected);
    });
    
    it('ignores subchunks that are not "labl"', () => {
      const chunkData = new Uint8Array([
        97, 100, 116, 108,      // "adtl"
        
        108, 97, 98, 108,       // Cue 1 "labl"
        10, 0, 0, 0,            // chunk data size
        1, 0, 0, 0,             // Cue point ID
        67, 117, 101, 32, 49, 0,// "Cue 1\0"

        102, 97, 107, 101,      // "fake"
        10, 0, 0, 0,            // chunk data size
        2, 0, 0, 0,             // Cue point ID
        67, 117, 101, 32, 50, 0 // "Cue 2\0"
      ]);
      const expected = ["Cue 1"];
      const labels = parseLabelsFromAdtlChunkData(chunkData);
      expect(labels).toEqual(expected);
    });
  });
});