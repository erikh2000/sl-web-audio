import {theAudioContext} from "../wrappers/theAudioContext";
import {decodeOggBlob, decodeOggBlobWithTags, EncodeTag} from "sl-web-ogg";

export async function oggBytesToAudioBuffer(oggBytes:Uint8Array):Promise<AudioBuffer> {
  const audioContext = theAudioContext();
  if (!audioContext) throw new Error('AudioContext not available'); // User gesture may be needed.
  const blob = new Blob([oggBytes], {type: 'audio/ogg'});
  return await decodeOggBlob(blob, audioContext);
}

export async function oggBytesToAudioBufferAndTags(oggBytes:Uint8Array):Promise<[audioBuffer:AudioBuffer, tags:EncodeTag[]]> {
  const audioContext = theAudioContext();
  if (!audioContext) throw new Error('AudioContext not available'); // User gesture may be needed.
  const blob = new Blob([oggBytes], {type: 'audio/ogg'});
  const [audioBuffer, tags] = await decodeOggBlobWithTags(blob, audioContext);
  return [audioBuffer, tags];
}