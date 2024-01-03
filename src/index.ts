export type { default as WavCue } from './wavFile/WavCue';
export type { default as WavFileData } from './wavFile/WavFileData';
export { default as Microphone } from './wrappers/Microphone';

export * from './wrappers/audioBufferUtil';
export * from './wrappers/loadAudioUtil';
export * from './wrappers/playAudioUtil';
export * from './wrappers/theAudioContext';
export * from './generating/silenceUtil';
export * from './processing/noiseFloorUtil';
export * from './processing/peakUtil';
export * from './processing/rmsUtil';
export * from './processing/sampleUtil';
export * from './wavFile/encodeUtil';
export * from './wavFile/decodeUtil';
export * from './oggFile/encodeUtil';

/* This file only imports and re-exports top-level APIs and has been excluded from Jest 
   coverage reporting in package.json. All the exports are tested via unit tests associated
   with the import module. */