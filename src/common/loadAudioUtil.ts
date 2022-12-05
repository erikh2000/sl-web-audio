import {theAudioContext} from "./theAudioContext";
import {blobToAudioBuffer} from "./audioBufferUtil";

export type WavFileData = {
  filename:string,
  audioBuffer:AudioBuffer
}

export async function loadWavFromUrl(url:string):Promise<AudioBuffer> {
  const response = await fetch(url);
  const blob = await response.blob()
  const arrayBuffer = await blob.arrayBuffer();
  const ac = theAudioContext() as AudioContext;
  return await ac.decodeAudioData(arrayBuffer);
}

async function _selectWavFileHandles(multiple:boolean):Promise<FileSystemFileHandle[]|null> {
  const openFileOptions = {
    excludeAcceptAllOption: true,
    multiple,
    types: [{
      description: 'Wave Files',
      accept: {'audio/wav': ['.wav']}
    }]
  };
  try {
    return (window as any).showOpenFilePicker(openFileOptions);
  } catch(err) {
    console.log(err);
    return null;
  }
}

async function _readWavDataFromFileHandle(fileHandle:FileSystemFileHandle, audioContext:AudioContext):Promise<WavFileData> {
  const filename = fileHandle.name;
  const blob = await fileHandle.getFile();
  const audioBuffer = await blobToAudioBuffer(audioContext, blob);
  return { filename, audioBuffer };
}

export async function loadWavFromFileSystem():Promise<WavFileData|null> {
  const fileHandles:FileSystemFileHandle[]|null = await _selectWavFileHandles(false);
  if (!fileHandles) return null;
  const audioContext = theAudioContext();
  if (!audioContext) return null;
  return _readWavDataFromFileHandle(fileHandles[0], audioContext);
}

export async function loadWavsFromFileSystem():Promise<WavFileData[]|null> {
  const fileHandles:FileSystemFileHandle[]|null = await _selectWavFileHandles(true);
  if (!fileHandles) return null;
  const audioContext = theAudioContext();
  if (!audioContext) return null;

  return Promise.all(fileHandles.map(fileHandle => _readWavDataFromFileHandle(fileHandle, audioContext)));
}