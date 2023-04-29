import WavCue from "./WavCue";
import {findWavChunk, parseCuesFromCueChunkData, parseLabelsFromAdtlChunkData} from "./riffUtil";
import {theAudioContext} from "../common/theAudioContext";

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
  return await ac.decodeAudioData(wavBytes.buffer);
}

export async function wavBytesToAudioBufferAndCues(wavBytes:Uint8Array):Promise<[audioBuffer:AudioBuffer, cues:WavCue[]]> {
  const audioBuffer = await wavBytesToAudioBuffer(wavBytes);
  const cues = _parseCues(wavBytes, audioBuffer.sampleRate);
  return [audioBuffer, cues];
}