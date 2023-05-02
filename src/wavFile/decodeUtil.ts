import WavCue from "./WavCue";
import {findWavChunk} from "./riffUtil";
import {theAudioContext} from "../wrappers/theAudioContext";
import {parseCuesFromCueChunkData} from "./cueChunkUtil";
import {parseLabelsFromAdtlChunkData} from "./adtlChunkUtil";

function _addLabelsToCues(cues:WavCue[], labels:string[]) {
  for (let i = 0; i < cues.length && i < labels.length; ++i) {
    cues[i].label = labels[i];
  }
}

function _parseCues(wavBytes:Uint8Array, sampleRate:number):WavCue[] {
  const cueChunkData = findWavChunk(wavBytes, 'cue ');
  if (!cueChunkData) return [];
  const cues = parseCuesFromCueChunkData(cueChunkData, sampleRate);
  const adtlChunkData = findWavChunk(wavBytes, 'list');
  if (!adtlChunkData) return cues;
  const labels = parseLabelsFromAdtlChunkData(adtlChunkData);
  _addLabelsToCues(cues, labels);
  return cues;
}

export async function wavBytesToAudioBuffer(wavBytes:Uint8Array):Promise<AudioBuffer> {
  const ac = theAudioContext() as AudioContext;
  if (!ac) throw new Error('AudioContext not available');
  /* I could parse the bytes myself rather than using the browser's decodeAudioData(). But I have more confidence in 
     the browser implementation to handle edge cases like WAV encodings that are off-spec. And I expect the 
     native implementation of decodeAudioData() will be faster in most, if not all, cases. */
  return await ac.decodeAudioData(wavBytes.buffer);
}

export async function wavBytesToAudioBufferAndCues(wavBytes:Uint8Array):Promise<[audioBuffer:AudioBuffer, cues:WavCue[]]> {
  const audioBuffer = await wavBytesToAudioBuffer(wavBytes);
  const cues = _parseCues(wavBytes, audioBuffer.sampleRate);
  return [audioBuffer, cues];
}