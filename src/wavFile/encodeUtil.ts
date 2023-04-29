import { encodeRiffWaveHeader, textToNullTerminatedAscii } from "./riffUtil";
import {WISP_BIT_DEPTH, WISP_BYTES_PER_SAMPLE, WISP_CHANNEL_COUNT, WISP_SAMPLE_RATE} from "./wispFormatConstants";
import WavCue from "./WavCue";
import {
  timeToSampleCount,
  combineChannelSamples,
  resample,
  samplesToPcmData
} from '../processing/sampleUtil';

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

// Version# of format used for creating WAV files with WISP-related meta-data. Update version# when 
// meta-data format changes. This version# is not coupled to any other version# in WISP.

const WAVE_FORMAT_PCM = 1;

function _encodeFmtChunk():Uint8Array {
  const chunk = new Uint8Array(24);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x666d7420, false); // "fmt "
  view.setUint32(4, 16, true); // Chunk size, excluding this header.
  view.setUint16(8, WAVE_FORMAT_PCM, true); // Format code
  view.setUint16(10, WISP_CHANNEL_COUNT, true); // Channel count - always mono for WISP.
  view.setUint32(12, WISP_SAMPLE_RATE, true); // Sample rate
  view.setUint32(16, WISP_SAMPLE_RATE * WISP_BYTES_PER_SAMPLE, true); // Byte rate
  view.setUint16(20, WISP_BYTES_PER_SAMPLE, true); // Block align
  view.setUint16(22, WISP_BIT_DEPTH, true); // Bits per sample

  return chunk;
}

function _encodeDataChunk(samples:Float32Array):Uint8Array {
  const pcmData = samplesToPcmData(samples);
  const chunk = new Uint8Array(8 + pcmData.length);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x64617461, false); // "data"
  view.setUint32(4, samples.length * WISP_BYTES_PER_SAMPLE, true); // Chunk size, excluding this header.
  chunk.set(pcmData, 8);

  return chunk;
}

function _getNormalizedSamplesFromAudioBuffer(audioBuffer:AudioBuffer):Float32Array {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samplesByChannel:Float32Array[] = [];
  for (let channel = 0; channel < channelCount; channel++) {
    samplesByChannel[channel] = new Float32Array(audioBuffer.getChannelData(channel));
  }
  let samples = channelCount === 1 ? samplesByChannel[0] : combineChannelSamples(samplesByChannel);
  if (sampleRate !== WISP_SAMPLE_RATE) samples = resample(samples, sampleRate, WISP_SAMPLE_RATE);
  return samples;
}

function _getNormalizedSamples(samples:Float32Array, sampleRate:number):Float32Array {
  return (sampleRate === WISP_SAMPLE_RATE) ? samples : resample(samples, sampleRate, WISP_SAMPLE_RATE);
}

function _encodeCueChunk(cues:WavCue[]):Uint8Array {
  if (!cues.length) return new Uint8Array(0);

  const cueCount = cues.length;
  const chunk = new Uint8Array(12 + 24 * cueCount);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x63756520, false); // "cue "
  view.setUint32(4, 4 + 24 * cueCount, true); // Chunk size, excluding this header.
  view.setUint32(8, cueCount, true); // Cue count

  let writePos = 12;
  for(let i = 0; i < cueCount; ++i) {
    const sampleOffset = timeToSampleCount(cues[i].position, WISP_SAMPLE_RATE);
    view.setUint32(writePos, i + 1, true); writePos += 4; // Cue point ID
    view.setUint32(writePos, 0, true); writePos += 4; // Position - ignored because not using playlist.
    view.setUint32(writePos, 0x64617461, false); writePos += 4; // Data chunk ID
    view.setUint32(writePos, 0, true); writePos += 4; // Chunk start - ignored because there is only one data chunk.
    view.setUint32(writePos, 0, true); writePos += 4; // Block start - ignored because data is not compressed.
    view.setUint32(writePos, sampleOffset, true); writePos += 4; // Sample offset
  }

  return chunk;
}

function _encodeAdtlChunk(cues:WavCue[]):Uint8Array {
  if (!cues.length) return new Uint8Array(0);

  const cueCount = cues.length;
  const combinedLabelLength = cues.reduce((sum, cue) => sum + cue.label.length + 1, 0);
  const chunkSize = 4 + (12 * cueCount) + combinedLabelLength
  const chunk = new Uint8Array(8 + chunkSize);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 0x6c696e74, false); // "list"
  view.setUint32(4, chunkSize, true); // Chunk size, excluding this header.
  view.setUint32(8, 0x6164746c, false); // "adtl"

  let writePos = 12;
  for(let i = 0; i < cueCount; ++i) {
    view.setUint32(writePos, 0x6c626c20, false); writePos += 4; // "labl"
    view.setUint32(writePos, 4 + cues[i].label.length + 1, true); writePos += 4; // Chunk size, excluding this header.
    view.setUint32(writePos, i+1, false); writePos += 4; // Cue point ID
    const szLabel = textToNullTerminatedAscii(cues[i].label)
    chunk.set(szLabel, writePos); writePos += szLabel.length;
  }

  return chunk;
}

function _normalizedSamplesAndCuePointsToWavBytes(samples:Float32Array, cues:WavCue[]):Uint8Array {
  const fmtChunk = _encodeFmtChunk();
  const cueChunk = _encodeCueChunk(cues);
  const adtlChunk = _encodeAdtlChunk(cues);
  const dataChunk = _encodeDataChunk(samples);
  const header = encodeRiffWaveHeader(fmtChunk.length + cueChunk.length + adtlChunk.length + dataChunk.length + 4);

  let writePos = 0;
  const _writeChunk = (chunk:Uint8Array) => {
    if (!chunk.length) return;
    wavBytes.set(chunk, writePos);
    writePos += chunk.length;
  }

  const fileSize = header.length + fmtChunk.length + cueChunk.length + adtlChunk.length + dataChunk.length;
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

export function downloadWavBytes(wavBytes:Uint8Array, filename:string) {
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}