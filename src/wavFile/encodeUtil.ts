import { WISP_SAMPLE_RATE } from "./wispFormatConstants";
import WavCue from "./WavCue";
import { combineChannelSamples, resample } from '../processing/sampleUtil';
import {encodeWispFmtChunk} from "./fmtChunkUtil";
import {encodeWispDataChunk} from "./dataChunkUtil";
import {encodeWispCueChunk} from "./cueChunkUtil";
import {encodeWispAdtlChunk} from "./adtlChunkUtil";
import {encodeRiffWaveHeader} from "./riffHeaderUtil";

/* When WISP writes WAV files, it uses 16-bit, 44.1 kHz, mono, and adds cue points for visemes used in lip animation.
   When WISP reads WAV files, it parses any valid WAV file, and will attempt to load cue points for visemes without
   failing if they are not present. 

   How a WISP-written wav file is structured in terms of RIFF chunks:
   
     "WAVE" chunk
      "fmt " chunk
      "data" chunk
      "cue " chunk         - Cue points contain timings for visemes   
      "adtl" chunk
        "labl" chunk(s)    - Viseme names associated with cue points. "viseme-rest", "viseme-mbp", etc.
        
   I've referenced the original Microsoft/IBM v1.0 spec for the RIFF/WAV format at https://www.aelius.com/njh/wavemetatools/doc/riffmci.pdf, 
   and followed it as best I could. On p56, it describes the WAVE form as:
   
   <WAVE-form> ➝
      RIFF( 'WAVE'
        <fmt-ck>            - Format
        [<fact-ck>]         - Fact chunk
        [<cue-ck>]          - Cue points
        [<playlist-ck>]     - Playlist
        [<assoc-data-list>] - Associated data list
        <wave-data> )       - Wave data
        
   ...which implies a different chunk order than what I've chosen. However, in practice, many readers fail to parse a WAV file that
   does not immediately follow the "fmt" chunk with a "data" chunk. It doesn't matter that these readers are not following the spec,
   they are out there, and I'd like WISP wav files to be readable by them. Shame on you, Audacity, iTunes, and probably others. 
*/

function _getNormalizedSamplesFromAudioBuffer(audioBuffer:AudioBuffer):Float32Array {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samplesByChannel:Float32Array[] = [];
  for (let channel = 0; channel < channelCount; channel++) {
    samplesByChannel[channel] = new Float32Array(audioBuffer.getChannelData(channel));
  }
  let samples = combineChannelSamples(samplesByChannel);
  if (sampleRate !== WISP_SAMPLE_RATE) samples = resample(samples, sampleRate, WISP_SAMPLE_RATE);
  return samples;
}

function _getNormalizedSamples(samples:Float32Array, sampleRate:number):Float32Array {
  return (sampleRate === WISP_SAMPLE_RATE) ? samples : resample(samples, sampleRate, WISP_SAMPLE_RATE);
}

function _normalizedSamplesAndCuePointsToWavBytes(samples:Float32Array, cues:WavCue[]):Uint8Array {
  const fmtChunk = encodeWispFmtChunk();
  const dataChunk = encodeWispDataChunk(samples);
  const cueChunk = encodeWispCueChunk(cues);
  const adtlChunk = encodeWispAdtlChunk(cues);
  const combinedChunkSize = fmtChunk.length + dataChunk.length + cueChunk.length + adtlChunk.length;
  const header = encodeRiffWaveHeader(combinedChunkSize +  + 4);

  let writePos = 0;
  const _writeChunk = (chunk:Uint8Array) => {
    if (!chunk.length) return;
    wavBytes.set(chunk, writePos);
    writePos += chunk.length;
  }

  const fileSize = header.length + combinedChunkSize;
  const wavBytes = new Uint8Array(fileSize);
  _writeChunk(header);
  _writeChunk(fmtChunk);
  _writeChunk(dataChunk);
  _writeChunk(cueChunk);
  _writeChunk(adtlChunk);
  
  return wavBytes;
}

export function samplesToWavBytes(samples:Float32Array, sampleRate:number):Uint8Array {
  const normalizedSamples = _getNormalizedSamples(samples, sampleRate);
  return _normalizedSamplesAndCuePointsToWavBytes(normalizedSamples, []);
}

export function audioBufferAndCuesToWavBytes(audioBuffer:AudioBuffer, cues:WavCue[]):Uint8Array {
  const normalizedSamples = _getNormalizedSamplesFromAudioBuffer(audioBuffer);
  return _normalizedSamplesAndCuePointsToWavBytes(normalizedSamples, cues);
}

export function audioBufferToWavBytes(audioBuffer:AudioBuffer):Uint8Array {
  const normalizedSamples = _getNormalizedSamplesFromAudioBuffer(audioBuffer);
  return _normalizedSamplesAndCuePointsToWavBytes(normalizedSamples, [])
}

export function wavBytesToJs(wavBytes:Uint8Array):string {
  const jsBytes = Array.from(wavBytes).join(',');
  return `const wavBytes = new Uint8Array([${jsBytes}]);`;
}