import { encodeAudioBuffer, EncodeTag } from "sl-web-ogg";

const DEFAULT_QUALITY = .5;
export async function audioBufferToOggBytes(audioBuffer:AudioBuffer, quality:number = DEFAULT_QUALITY):Promise<Uint8Array> {
  const oggBlob = await encodeAudioBuffer(audioBuffer, {quality}); 
  const arrayBuffer = await oggBlob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function audioBufferAndTagsToOggBytes(audioBuffer:AudioBuffer, tags:EncodeTag[], quality:number = DEFAULT_QUALITY):Promise<Uint8Array> {
  const oggBlob = await encodeAudioBuffer(audioBuffer, {quality, tags});
  const arrayBuffer = await oggBlob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}