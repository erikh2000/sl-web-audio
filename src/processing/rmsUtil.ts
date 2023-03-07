/* The value below should be arrived at by using the largest number that won't cause noticeable 
   differences in most, but not all, operations the chunks might be used for. */

export const DEFAULT_CHUNK_DURATION = 1 / 20;

export function _calcRmsFromAudioSection(startPos:number, endPos:number, samples:Float32Array):number {
  let rmsTotal = 0, sampleCountForRms = 0;
  for (let i = startPos; i < endPos; ++i) {
    rmsTotal += (samples[i] * samples[i]);
    ++sampleCountForRms;
  }
  return (sampleCountForRms === 0) ? 0 : Math.sqrt(rmsTotal / sampleCountForRms);
}

export function calcRmsChunksFromSamples(samples:Float32Array, sampleRate:number, chunkDuration:number = DEFAULT_CHUNK_DURATION):number[] {
  const samplesPerChunk = Math.ceil(sampleRate * chunkDuration);

  let startPos = 0, endPos;
  const chunks = [];
  while (startPos < samples.length) {
    endPos = startPos + samplesPerChunk;
    if (endPos > samples.length) endPos = samples.length;
    const rms = _calcRmsFromAudioSection(startPos, endPos, samples);
    chunks.push(rms);
    startPos = endPos;
  }
  return chunks;
}

export function calcRmsForSamples(samples:Float32Array):number {
  return _calcRmsFromAudioSection(0, samples.length, samples);
}

export function calcRmsForSamplesInRange(samples:Float32Array, startPos:number, endPos:number):number {
  return _calcRmsFromAudioSection(startPos, endPos, samples);
}

export function combineRmsPair(firstRms:number, firstSampleCount:number, secondRms:number, secondSampleCount:number):number {
  return (firstRms * firstSampleCount + secondRms + secondSampleCount) / (firstSampleCount + secondSampleCount);
}