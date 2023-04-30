
const PCM_BYTES_PER_SAMPLE = 2;
const MAX_16BIT_PCM_VALUE = 32767;
export const sampleCountToTime = (sampleCount:number, sampleRate:number) => sampleCount / sampleRate;

export const timeToSampleCount = (time:number, sampleRate:number) => time * sampleRate;

export const sampleCountToMSecs = (sampleCount:number, sampleRate:number) => Math.round((sampleCount / sampleRate) * 1000);

export const mSecsToSampleCount = (mSecs:number, sampleRate:number) => Math.round((mSecs / 1000) * sampleRate);

export const samplesToJs = (samples:Float32Array) => 'export const samples = [' + samples.join(',') + '];\n';

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
  if (fromSampleRate === toSampleRate) return new Float32Array(samples)
  const resampleRatio = toSampleRate / fromSampleRate;
  const fromRatio = fromSampleRate / toSampleRate; 
  const resampledSamples = new Float32Array(Math.ceil(samples.length * resampleRatio));
  for (let i = 0; i < resampledSamples.length; ++i) {
    const fromSampleI = i * fromRatio;
    const leftValue = samples[Math.floor(fromSampleI)];
    let rightValueI = Math.ceil(fromSampleI);
    if (rightValueI >= samples.length) rightValueI = samples.length - 1;
    const rightValue = samples[rightValueI];
    const leftWeight = fromSampleI - Math.floor(fromSampleI);
    const rightWeight = 1 - leftWeight;
    resampledSamples[i] = leftValue * leftWeight + rightValue * rightWeight;
  }
  return resampledSamples;
}

export function combineChannelSamples(samplesByChannel:Float32Array[]):Float32Array {
  if (samplesByChannel.length === 1) return samplesByChannel[0];
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

// Encode an array of 32-bit float samples as 16-bit PCM (signed 16-bit int) data.
export function samplesToPcmData(samples:Float32Array):Uint8Array {
  const sampleCount = samples.length;
  const pcmData = new Uint8Array(sampleCount * PCM_BYTES_PER_SAMPLE);
  const view = new DataView(pcmData.buffer);
  for (let i = 0; i < sampleCount; ++i) {
    const sample = samples[i];
    const sampleValue = Math.round(sample * MAX_16BIT_PCM_VALUE);
    view.setInt16(i * PCM_BYTES_PER_SAMPLE, sampleValue, true);
  }
  return pcmData;
}