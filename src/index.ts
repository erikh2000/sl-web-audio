export type { default as WavCue } from './wavFile/WavCue';
export type { default as WavFileData } from './wavFile/WavFileData';
export { default as Microphone } from './recording/Microphone';

export * from './common/audioBufferUtil';
export * from './common/loadAudioUtil';
export * from './common/playAudioUtil';
export * from './common/theAudioContext';
export * from './processing/noiseFloorUtil';
export * from './processing/peakUtil';
export * from './processing/rmsUtil';
export * from './processing/sampleUtil';
export * from './wavFile/encodeUtil';
export * from './wavFile/decodeUtil';

/* This file only imports and re-exports top-level APIs and has been excluded from Jest 
   coverage reporting in package.json. All the exports are tested via unit tests associated
   with the import module. */