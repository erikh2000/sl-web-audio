export const sampleCountToTime = (sampleCount:number, sampleRate:number) => sampleCount / sampleRate;

export const timeToSampleCount = (time:number, sampleRate:number) => time * sampleRate;

export const sampleCountToMSecs = (sampleCount:number, sampleRate:number) => Math.round((sampleCount / sampleRate) * 1000);

export const mSecsToSampleCount = (mSecs:number, sampleRate:number) => Math.round((mSecs / 1000) * sampleRate);

export const samplesToJs = (samples:Float32Array) => 'export const samples = [' + samples.join(',') + '];\n';

export const samplesToJsClipboard = (samples:Float32Array) => navigator.clipboard.writeText(samplesToJs(samples));