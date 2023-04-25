import {calcRmsChunksFromSamples, estimateAveragePeakAmplitudeFromRms} from "./rmsUtil";
import {DEFAULT_CHUNK_DURATION} from "./rmsUtil";

export interface IFindSilenceThresholdOptions {
  chunkDuration:number,
  rmsSegmentCount:number
}

const DEFAULT_NOISE_FLOOR_OPTIONS:IFindSilenceThresholdOptions = {
  chunkDuration: DEFAULT_CHUNK_DURATION,
  rmsSegmentCount: 10
}

export interface IRmsSegment {
  fromValue:number,
  toValue:number, // exclusive
  foundCount:number
}

export interface INoiseFloorData {
  chunks:number[],
  maxRms:number,
  rmsSegments:IRmsSegment[],
  mostFrequentSegmentI:number,
  noiseFloorRms:number
}

function _findMax(array:Array<number>):number {
  let max = -Infinity;
  for(let i = 0; i < array.length; ++i) {
    if (array[i] > max) max = array[i];
  }
  return max;
}

function _createRmsSegments(segmentCount:number, maxValue:number) {
  const segmentRangeSize = maxValue / segmentCount;
  const segments:IRmsSegment[] = [];
  let fromValue = 0;
  for(let segmentI = 0; segmentI < segmentCount; ++segmentI) {
    const toValue = (segmentI === segmentCount - 1) ? Infinity : fromValue + segmentRangeSize;
    segments.push({fromValue, toValue, foundCount:0});
    fromValue = toValue;
  }
  return segments;
}

export function findSegmentContainingRms(segments:IRmsSegment[], rms:number):number {
  for(let segmentI = 0; segmentI < segments.length; ++segmentI) {
    if (rms < segments[segmentI].toValue) return segmentI;
  }
  return -1;
}

function _findMostFrequentSegment(chunks:number[], segments:IRmsSegment[]):number {
  let mostFrequentSegmentChunkCount = -1;
  let mostFrequentSegmentI = -1;
  const maxSegmentI = segments.length - 1;
  for(let chunkI = 0; chunkI < chunks.length; ++chunkI) {
    const segmentI = findSegmentContainingRms(segments, chunks[chunkI]);
    if (segmentI === maxSegmentI) continue; // Avoid interpreting flat lines of amplitude clipping as a noise floor.
    const foundCount = ++(segments[segmentI].foundCount);
    if (foundCount < mostFrequentSegmentChunkCount ||
      // For ties, always use the segment with lower amplitude.
      (foundCount === mostFrequentSegmentChunkCount && mostFrequentSegmentI < segmentI)) continue;
    mostFrequentSegmentChunkCount = segments[segmentI].foundCount;
    mostFrequentSegmentI = segmentI;
  }
  return mostFrequentSegmentI;
}

function _calcOtherSegmentsFoundCountAverage(segments:IRmsSegment[], excludeSegmentOneI:number, excludeSegmentTwoI:number) {
  if (segments.length < 3) return 0; // No segments to average if 2 will be excluded.
  let sum = 0;
  for(let segmentI = 0; segmentI < segments.length; ++segmentI) {
    if (segmentI === excludeSegmentOneI || segmentI === excludeSegmentTwoI) continue;
    sum += segments[segmentI].foundCount;
  }
  return sum / (segments.length - 2);
}

function _interpolateNoiseFloorRmsFromSegmentAnalysis(segments:IRmsSegment[], mostFrequentSegmentI:number) {
  const aboveSegmentI = mostFrequentSegmentI + 1;
  const otherSegmentFoundCountAverage = _calcOtherSegmentsFoundCountAverage(segments, mostFrequentSegmentI, aboveSegmentI);
  const lowestNoiseFloorRms = segments[mostFrequentSegmentI].toValue;

  const aboveFoundCount = segments[aboveSegmentI].foundCount;
  if (aboveFoundCount < otherSegmentFoundCountAverage) return lowestNoiseFloorRms;

  const mostFrequentFoundCount = segments[mostFrequentSegmentI].foundCount;
  const interpolationRange = segments[aboveSegmentI].toValue - lowestNoiseFloorRms;
  const interpolateRatio = (aboveFoundCount - otherSegmentFoundCountAverage) / (mostFrequentFoundCount - otherSegmentFoundCountAverage);
  return lowestNoiseFloorRms + (interpolateRatio * interpolationRange);
}

export function findNoiseFloor(samples:Float32Array, sampleRate:number, options:IFindSilenceThresholdOptions = DEFAULT_NOISE_FLOOR_OPTIONS):INoiseFloorData {
  const chunks = calcRmsChunksFromSamples(samples, sampleRate, options.chunkDuration);
  const maxRms = _findMax(chunks);
  const rmsSegments = _createRmsSegments(options.rmsSegmentCount, maxRms);
  const mostFrequentSegmentI = _findMostFrequentSegment(chunks, rmsSegments);
  const noiseFloorRms = _interpolateNoiseFloorRmsFromSegmentAnalysis(rmsSegments, mostFrequentSegmentI);
  return {
    chunks,
    maxRms,
    rmsSegments,
    mostFrequentSegmentI,
    noiseFloorRms: estimateAveragePeakAmplitudeFromRms(noiseFloorRms)
  }
}