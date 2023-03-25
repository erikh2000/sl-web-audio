export function findMaxPeakInSampleRange(samples: Float32Array, startSampleNo: number, endSampleNo: number): number {
  let maxPeak = 0;
  for (let sampleNo = startSampleNo; sampleNo < endSampleNo; sampleNo++) {
    const peak = Math.abs(samples[sampleNo]);
    if (peak > maxPeak) maxPeak = peak;
  }
  return maxPeak;
}

export function findMaxPeakInSamples(samples: Float32Array): number {
  return findMaxPeakInSampleRange(samples, 0, samples.length);
}