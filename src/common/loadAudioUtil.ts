import {wavBytesToAudioBufferAndCues} from "./wavUtil";
import WavFileData from "./WavFileData";

export async function loadWavFromUrl(url:string):Promise<WavFileData> {
  const response = await fetch(url);
  const blob = await response.blob()
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const [audioBuffer, cues] = await wavBytesToAudioBufferAndCues(bytes);
  return {filename:url, audioBuffer, cues};
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

async function _readWavDataFromFileHandle(fileHandle:FileSystemFileHandle):Promise<WavFileData> {
  const filename = fileHandle.name;
  const blob = await fileHandle.getFile();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const [audioBuffer, cues] = await wavBytesToAudioBufferAndCues(bytes);
  return {filename, audioBuffer, cues};
}

export async function loadWavFromFileSystem():Promise<WavFileData|null> {
  const fileHandles:FileSystemFileHandle[]|null = await _selectWavFileHandles(false);
  if (!fileHandles) return null;
  return _readWavDataFromFileHandle(fileHandles[0]);
}

export async function loadWavsFromFileSystem():Promise<WavFileData[]|null> {
  const fileHandles:FileSystemFileHandle[]|null = await _selectWavFileHandles(true);
  if (!fileHandles) return null;
  return Promise.all(fileHandles.map(fileHandle => _readWavDataFromFileHandle(fileHandle)));
}