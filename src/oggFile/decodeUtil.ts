import {theAudioContext} from "../wrappers/theAudioContext";
import {decodeOggBlob, decodeOggBlobWithTags, EncodeTag} from "sl-web-ogg";

function _uint8ArrayToBlob(bytes:Uint8Array):Blob {
  const blobPart = bytes.buffer as BlobPart;
  return new Blob([blobPart], {type: 'audio/ogg'});
}

export async function oggBytesToAudioBuffer(oggBytes:Uint8Array):Promise<AudioBuffer> {
  const audioContext = theAudioContext();
  if (!audioContext) throw new Error('AudioContext not available'); // User gesture may be needed.
  const blob = _uint8ArrayToBlob(oggBytes);
  return await decodeOggBlob(blob, audioContext);
}

export async function oggBytesToAudioBufferAndTags(oggBytes:Uint8Array):Promise<[audioBuffer:AudioBuffer, tags:EncodeTag[]]> {
  const audioContext = theAudioContext();
  if (!audioContext) throw new Error('AudioContext not available'); // User gesture may be needed.
  const blob = _uint8ArrayToBlob(oggBytes);
  const [audioBuffer, tags] = await decodeOggBlobWithTags(blob, audioContext);
  return [audioBuffer, tags];
}