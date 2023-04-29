import WavCue from "./WavCue";
import { theAudioContext } from "./theAudioContext";
import {timeToSampleCount, sampleCountToTime, combineChannelSamples, resample} from '../processing/sampleUtil';

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
export const WISP_ISFT_TAG = 'WISP WAV 1.0';

const WISP_SAMPLE_RATE = 44100;
const WISP_BIT_DEPTH = 16;
const WISP_BYTES_PER_SAMPLE = WISP_BIT_DEPTH / 8;
const WISP_CHANNEL_COUNT = 1;
const MAX_16BIT_PCM_VALUE = 32767;

const WAVE_FORMAT_PCM = 1;
const CHUNK_SIZE_OFFSET = 4;
const CHUNK_DATA_OFFSET = 8;

function _readUint32(bytes:Uint8Array, offset:number):number {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] << 24);
}

function _readNullTerminatedAscii(bytes:Uint8Array, offset:number, maxLength:number):string {
  let text = '';
  for (let i = 0; i < maxLength; ++i) {
    const byte = bytes[offset+i];
    if (byte === 0) break;
    text += String.fromCharCode(byte);
  }
  return text;
}

// Find first chunk inside RIFF matching chunkId and return chunk data bytes for it or null if not found.
function _findWavChunk(wavBytes:Uint8Array, chunkId:string):Uint8Array|null {
  const chunkIdBytes = new TextEncoder().encode(chunkId);
  const wavBytesLen = wavBytes.length;

  const _doesChunkIdMatch = () => {
    return wavBytes[readI] === chunkIdBytes[0] && wavBytes[readI + 1] === chunkIdBytes[1] &&
      wavBytes[readI + 2] === chunkIdBytes[2] && wavBytes[readI + 3] === chunkIdBytes[3];
  }

  const _copyChunkData = (chunkDataSize:number):Uint8Array => {
    return wavBytes.subarray(readI + CHUNK_DATA_OFFSET, readI + CHUNK_DATA_OFFSET + chunkDataSize);
  }

  let readI = 12; // Skip to position in data after RIFF header.
  while (readI < wavBytesLen) {
    const chunkDataSize = _readUint32(wavBytes, readI + CHUNK_SIZE_OFFSET)
    if (_doesChunkIdMatch()) return _copyChunkData(chunkDataSize);
    readI += CHUNK_DATA_OFFSET + chunkDataSize;
  }
  return null;
}

function _parseCuesFromCueChunkData(cueChunkData:Uint8Array, sampleRate:number):WavCue[] {
  const CUE_POINT_OFFSET = 4;
  const CUE_POINT_DATA_SIZE = 24;
  const SAMPLE_OFFSET = 20;
  const cueCount = _readUint32(cueChunkData, 0);
  const cues:WavCue[] = [];
  for (let cueI = 0; cueI < cueCount; ++cueI) {
    const sampleOffsetI = CUE_POINT_OFFSET + (cueI * CUE_POINT_DATA_SIZE) + SAMPLE_OFFSET;
    const sampleOffset = _readUint32(cueChunkData, sampleOffsetI);
    const position = sampleCountToTime(sampleOffset, sampleRate);
    cues.push({ position, label:'' });
  }
  return cues;
}

function _parseLabelsFromAdtlChunkData(adtlChunkData:Uint8Array):string[] {
  const SUB_CHUNK_HEADER_SIZE = 8;
  const labels:string[] = [];
  const chunkDataSize = adtlChunkData.length;
  let readI = 4; // Skip over "adtl" chunk ID.
  while(readI < chunkDataSize) {
    const subChunkId = _readUint32(adtlChunkData, readI);
    const subChunkDataSize = _readUint32(adtlChunkData, readI + 4);
    if (subChunkId === 0x6c626c20) { // "labl"
      const label = _readNullTerminatedAscii(adtlChunkData, readI + SUB_CHUNK_HEADER_SIZE, subChunkDataSize);
      labels.push(label);
    }
    readI += SUB_CHUNK_HEADER_SIZE + subChunkDataSize;
  }
  return labels;
}

function _addLabelsToCues(cues:WavCue[], labels:string[]) {
  for (let i = 0; i < cues.length && i < labels.length; ++i) {
    cues[i].label = labels[i];
  }
}

function _parseCues(wavBytes:Uint8Array, sampleRate:number):WavCue[] {
  const cueChunkData = _findWavChunk(wavBytes, 'cue ');
  if (!cueChunkData) return [];
  const cues = _parseCuesFromCueChunkData(cueChunkData, sampleRate);
  const adtlChunkData = _findWavChunk(wavBytes, 'list');
  if (!adtlChunkData) return cues;
  const labels = _parseLabelsFromAdtlChunkData(adtlChunkData);
  _addLabelsToCues(cues, labels);
  return cues;
}

function _encodeHeader(chunksDataSize:number):Uint8Array {
  const header = new Uint8Array(12);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF" - This is actually the file header, and not part of the root chunk, but... it's fine.
  view.setUint32(4, chunksDataSize, true); // Size of all the other chunks and this one, excluding the first 8 bytes.
  view.setUint32(8, 0x57415645, false); // "WAVE"
  return header;
}

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


// Encode an array of 32-bit float samples as 16-bit PCM (signed 16-bit int) data.
function _encodePcmData(samples:Float32Array):Uint8Array {
  const sampleCount = samples.length;
  const pcmData = new Uint8Array(sampleCount * WISP_BYTES_PER_SAMPLE);
  const view = new DataView(pcmData.buffer);
  for (let i = 0; i < sampleCount; ++i) {
    const sample = samples[i];
    const sampleValue = Math.round(sample * MAX_16BIT_PCM_VALUE);
    view.setInt16(i * WISP_BYTES_PER_SAMPLE, sampleValue, true);
  }
  return pcmData;
}

function _encodeDataChunk(samples:Float32Array):Uint8Array {
  const pcmData = _encodePcmData(samples);
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

function _textToNullTerminatedAscii(text:string):Uint8Array {
  const textBytes = new TextEncoder().encode(text);
  const nullTerminatedTextBytes = new Uint8Array(textBytes.length + 1); // +1 for null terminator
  nullTerminatedTextBytes.set(textBytes); // Default value is 0, so null terminator is already there.
  return nullTerminatedTextBytes;
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
    const szLabel = _textToNullTerminatedAscii(cues[i].label)
    chunk.set(szLabel, writePos); writePos += szLabel.length;
  }

  return chunk;
}

function _normalizedSamplesAndCuePointsToWavBytes(samples:Float32Array, cues:WavCue[]):Uint8Array {
  const fmtChunk = _encodeFmtChunk();
  const cueChunk = _encodeCueChunk(cues);
  const adtlChunk = _encodeAdtlChunk(cues);
  const dataChunk = _encodeDataChunk(samples);
  const header = _encodeHeader(fmtChunk.length + cueChunk.length + adtlChunk.length + dataChunk.length + 4);

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

export async function wavBytesToAudioBuffer(wavBytes:Uint8Array):Promise<AudioBuffer> {
  const ac = theAudioContext() as AudioContext;
  if (!ac) throw new Error('AudioContext not available');
  return await ac.decodeAudioData(wavBytes.buffer);
}

export async function wavBytesToAudioBufferAndCues(wavBytes:Uint8Array):Promise<[audioBuffer:AudioBuffer, cues:WavCue[]]> {
  const audioBuffer = await wavBytesToAudioBuffer(wavBytes);
  const cues = _parseCues(wavBytes, audioBuffer.sampleRate);
  return [audioBuffer, cues];
}

export function downloadWavBytes(wavBytes:Uint8Array, filename:string) {
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}