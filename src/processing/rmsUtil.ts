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
  return (firstRms * firstSampleCount + secondRms * secondSampleCount) / (firstSampleCount + secondSampleCount);
}

/* The fudge factor below is based on calculating actual peak average over multiple sets of samples and finding the 
   average ratio. The ratio over different sets went as low as .2 and as high as 1.2, but dropping outliers the
   range was more like .8 to 1.1. 
   
   On the sample set, overall accuracy was around 95%. If you need something more accurate, you can average the 
   peaks from sample data.
 */
const ESTIMATE_AVERAGE_PEAK_AMPLITUDE_FUDGE_FACTOR = .88;
export function estimateAveragePeakAmplitudeFromRms(rms:number) {
  return rms * ESTIMATE_AVERAGE_PEAK_AMPLITUDE_FUDGE_FACTOR;
}