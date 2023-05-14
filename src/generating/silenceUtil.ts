export function appendSilenceSamples(samples:Float32Array, sampleRate:number, silenceMSecs:number):Float32Array {
  const appendSampleCount = sampleRate * (silenceMSecs / 1000);
  const sampleCount = samples.length + appendSampleCount;
  const appendedSamples:Float32Array = new Float32Array(sampleCount);
  for(let sampleI = 0; sampleI < sampleCount; ++sampleI) {
    appendedSamples[sampleI] = sampleI < samples.length ? samples[sampleI] : 0;
  }
  return appendedSamples;
}

export function createSilenceSamples(sampleRate:number, silenceMSecs:number):Float32Array { 
  const sampleCount = sampleRate * (silenceMSecs / 1000);
  const samples:Float32Array = new Float32Array(sampleCount);
  for(let sampleI = 0; sampleI < sampleCount; ++sampleI) {
    samples[sampleI] = 0;
  }
  return samples;
}