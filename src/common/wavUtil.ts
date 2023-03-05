import WavCue from "./WavCue";

import {WaveFile} from "wavefile";

// Version# of format used for creating WAV files with WISP-related meta-data. Update version# when 
// meta-data format changes. This version# is not coupled to any other version# in WISP.
export const WISP_ISFT_TAG = 'WISP WAV 1.0';

// WISP speech audio is 16-bit, 44.1 kHz, mono.
const WISP_SAMPLE_RATE = 44100;
const WISP_BIT_DEPTH_CODE = '16';

function _samples64To32BitLinearPcm(float64Array:Float64Array):Float32Array {
  const MAX_32_BIT_LINEAR_PCM = 32767;
  const float32Array = new Float32Array(float64Array.length);
  for (let i = 0; i < float64Array.length; i++) {
    float32Array[i] = float64Array[i] / MAX_32_BIT_LINEAR_PCM;
  }
  return float32Array;
}

function _setWaveToExpectedSampleRate(waveFile:WaveFile) {
  if ((waveFile.fmt as any).sampleRate === WISP_SAMPLE_RATE) return;
  waveFile.toSampleRate(WISP_SAMPLE_RATE);
}

export function audioBufferAndCuesToWavBytes(audioBuffer:AudioBuffer, cues:WavCue[]):Uint8Array {
  const wav = new WaveFile();
  wav.fromScratch(1, audioBuffer.sampleRate, WISP_BIT_DEPTH_CODE, audioBuffer.getChannelData(0));
  _setWaveToExpectedSampleRate(wav);
  wav.setTag('ISFT', WISP_ISFT_TAG);
  cues.forEach(cue => wav.setCuePoint({label:cue.label, position:cue.position}));
  return wav.toBuffer();
}

export function audioBufferToWavBytes(audioBuffer:AudioBuffer):Uint8Array {
  return audioBufferAndCuesToWavBytes(audioBuffer, []);
}

export function wavBytesToAudioBufferAndCues(wavBytes:Uint8Array):[audioBuffer:AudioBuffer, cues:WavCue[]] {
  const wav = new WaveFile(wavBytes);
  
  _setWaveToExpectedSampleRate(wav);
  const samples64 = wav.getSamples(false);
  const samples = _samples64To32BitLinearPcm(samples64);
  const audioBuffer = new AudioBuffer({length: samples.length, sampleRate: WISP_SAMPLE_RATE});
  audioBuffer.copyToChannel(samples, 0);
  
  const cueList = wav.listCuePoints();
  let cues:WavCue[] = cueList.map(cue => {
      const { label, position } = cue as any;
      return {label, position} as WavCue;
  });
  
  // In the future, if there are multiple WISP format versions, then code here could upgrade data to the latest version.
  const isftTag = wav.getTag('ISFT');
  if (isftTag !== WISP_ISFT_TAG) cues = []; // Avoid using cues from non-WISP WAV files.

  return [audioBuffer, cues];
}

export function wavBytesToAudioBuffer(wavBytes:Uint8Array):AudioBuffer {
  const [audioBuffer] = wavBytesToAudioBufferAndCues(wavBytes);
  return audioBuffer;
}