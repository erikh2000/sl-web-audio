export const sampleCountToTime = (sampleCount:number, sampleRate:number) => sampleCount / sampleRate;

export const timeToSampleCount = (time:number, sampleRate:number) => time * sampleRate;

export const sampleCountToMSecs = (sampleCount:number, sampleRate:number) => Math.round((sampleCount / sampleRate) * 1000);

export const mSecsToSampleCount = (mSecs:number, sampleRate:number) => Math.round((mSecs / 1000) * sampleRate);

export const samplesToJs = (samples:Float32Array) => 'export const samples = [' + samples.join(',') + '];\n';

export const samplesToJsClipboard = (samples:Float32Array) => navigator.clipboard.writeText(samplesToJs(samples));

export type SampleCharacteristics = {
  minValue: number,
  maxValue: number,
  averageValue: number,
  zeroCount: number,
  sampleCount: number,
}

export function characterizeSamples(samples:Float32Array):SampleCharacteristics {
  const sampleCount = samples.length;
  let minValue = 1, maxValue = -1, averageValue = 0, zeroCount = 0;
  for (let i = 0; i < sampleCount; i++) {
    const sample = samples[i];
    if (sample < minValue) minValue = sample;
    if (sample > maxValue) maxValue = sample;
    averageValue += sample;
    if (sample === 0) zeroCount++;
  }
  averageValue /= sampleCount;
  return {minValue, maxValue, averageValue, zeroCount, sampleCount};
}

export function resample(samples:Float32Array, fromSampleRate:number, toSampleRate:number):Float32Array {
  const resampledSamples = new Float32Array(Math.round(samples.length * toSampleRate / fromSampleRate));
  for (let i = 0; i < resampledSamples.length; ++i) {
    const fromSampleI = i * fromSampleRate / toSampleRate;
    const leftValue = samples[Math.floor(fromSampleI)];
    const rightValue = samples[Math.ceil(fromSampleI)];
    const leftWeight = fromSampleI - Math.floor(fromSampleI);
    const rightWeight = 1 - leftWeight;
    resampledSamples[i] = leftValue * leftWeight + rightValue * rightWeight;
  }
  return resampledSamples;
}

export function combineChannelSamples(samplesByChannel:Float32Array[]):Float32Array {
  const channelCount = samplesByChannel.length;
  const sampleCount = samplesByChannel[0].length;
  const combinedSamples = new Float32Array(sampleCount);
  for (let sampleI = 0; sampleI < sampleCount; ++sampleI) {
    let sampleSum = 0;
    for (let channelI = 0; channelI < channelCount; ++channelI) {
      sampleSum += samplesByChannel[channelI][sampleI];
    }
    combinedSamples[sampleI] = sampleSum / channelCount;
  }
  return combinedSamples;
}