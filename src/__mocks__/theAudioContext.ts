// Mock only as needed to support functions under test.
async function _decodeAudioData(_wavBytes:ArrayBuffer):Promise<AudioBuffer> {
  const samples =  new Float32Array([0,1,2,3,4,5,6,7,8,9]);
  const fakeAudioBuffer:unknown = {
    sampleRate: 44100,
    length: samples.length,
    duration: samples.length / 44100,
    getChannelData: (_channel:number):Float32Array => samples
  };
  return fakeAudioBuffer as AudioBuffer;
}

export const theAudioContextMock = ():AudioContext|null => {
  const fakeAudioContext:unknown = { 
    decodeAudioData: _decodeAudioData
  };
  return fakeAudioContext as AudioContext;
}

export const theAudioContextUnavailableMock = ():AudioContext|null => null;