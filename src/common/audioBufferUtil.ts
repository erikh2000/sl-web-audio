import {timeToSampleCount} from '../processing/sampleUtil';

export function createAudioBufferForRange(audioBuffer:AudioBuffer, time:number, duration:number) {
  const { sampleRate, numberOfChannels } = audioBuffer;
  const sampleNo = timeToSampleCount(time, sampleRate);
  const sampleCount = timeToSampleCount(duration, sampleRate);
  const newAudioBuffer = new AudioBuffer({ length:sampleCount, numberOfChannels, sampleRate });
  for(let channelI = 0; channelI < numberOfChannels; ++channelI) {
    const rangeSamples = newAudioBuffer.getChannelData(channelI);
    audioBuffer.copyFromChannel(rangeSamples, channelI, sampleNo);
    // copyToChannel() below seems redundant. But after reading https://webaudio.github.io/web-audio-api/#acquire-the-content 
    // I'm unsure if I can count on writing to rangeSamples to also update newAudioBuffer on all browsers.
    newAudioBuffer.copyToChannel(rangeSamples, channelI);
  }
  return newAudioBuffer;
}

function _findAudioBufferStats(audioBuffers:AudioBuffer[]) {
  let sampleCount = 0, maxChannelCount = 1;
  audioBuffers.forEach(audioBuffer => {
    sampleCount += audioBuffer.length;
    if (audioBuffer.numberOfChannels > maxChannelCount) maxChannelCount = audioBuffer.numberOfChannels;
  });
  return [audioBuffers[0].sampleRate, sampleCount, maxChannelCount];
}

// All audioBuffers must be same sampleRate. If there are varied channel counts, the largest will be used.
export function combineAudioBuffers(audioBuffers:AudioBuffer[]) {
  const [sampleRate, combinedSampleCount, numberOfChannels] = _findAudioBufferStats(audioBuffers);

  const combinedAudioBuffer = new AudioBuffer({length:combinedSampleCount, numberOfChannels,sampleRate});

  let writePos = 0;
  audioBuffers.forEach(audioBuffer => {
    for(let toChannelI = 0; toChannelI < numberOfChannels; ++toChannelI) {
      const fromChannelI = toChannelI >= audioBuffer.numberOfChannels ? 0 : toChannelI;
      const fromSamples = audioBuffer.getChannelData(fromChannelI);
      combinedAudioBuffer.copyToChannel(fromSamples, toChannelI, writePos);
    }
    writePos += audioBuffer.length;
  });

  return combinedAudioBuffer;
}

export function cloneAudioBuffer(fromAudioBuffer:AudioBuffer) {
  const audioBuffer = new AudioBuffer({
    length:fromAudioBuffer.length,
    numberOfChannels:fromAudioBuffer.numberOfChannels,
    sampleRate:fromAudioBuffer.sampleRate
  });
  for(let channelI = 0; channelI < audioBuffer.numberOfChannels; ++channelI) {
    const samples = fromAudioBuffer.getChannelData(channelI);
    audioBuffer.copyToChannel(samples, channelI);
  }
  return audioBuffer;
}

export function toJs(fromAudioBuffer:AudioBuffer) {
  let concat =
    `export const length=${fromAudioBuffer.length};\n` +
    `export const numberOfChannels=${fromAudioBuffer.numberOfChannels};\n` +
    `export const sampleRate=${fromAudioBuffer.sampleRate};\n`;
  for(let channelI = 0; channelI < fromAudioBuffer.numberOfChannels; ++channelI) {
    const samples = fromAudioBuffer.getChannelData(channelI);
    concat +=
      `export const samples${channelI} = new Float32Array([${samples.join(',')}]);\n`;
  }
  concat +=
    `  return audioBuffer;\n` +
    `}\n` +
    `\n` +
    `export default getAudioBuffer;`;
  return concat;
}