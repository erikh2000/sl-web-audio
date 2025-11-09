import {waitForTheAudioContext} from './theAudioContext';

// For an AudioWorklet-based version of this see the "AudioWorklet" branch. There were incompatibilities with Webpack that I'm hoping get resolved in a future release of webpack.
// Reportedly, there is also an issue with AudioWorklet in Safari. https://stackoverflow.com/questions/73365059/audioworklet-playback-cut-in-half-on-iphone-devices-and-safari

export interface IReceiveAudioCallback {
  (samples:Float32Array, sampleRate:number):void
}

async function _getMicrophoneUserMedia():Promise<MediaStream> {
  const navigatorAny = navigator as any;
  if (!navigatorAny.mediaDevices) navigatorAny.mediaDevices = navigatorAny.webkitMediaDevices || navigatorAny.mozMediaDevices || navigatorAny.msMediaDevices;
  if (!navigatorAny.mediaDevices) throw Error('Browser does not support mediaDevices.');

  async function _getIt():Promise<MediaStream|null> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch(error) {
      return null;
    }
  }

  let mediaStream = await _getIt();
  if (mediaStream) return mediaStream;

  return new Promise<MediaStream>(resolve => {
    const timer = setInterval(() => {
      _getIt().then(mediaStream => {
        if (mediaStream) {
          clearInterval(timer);
          resolve(mediaStream);
          return;
        }
      });
    }, 500);
  });
}

function _getBestBufferSize():number {
  // "It is recommended for authors to not specify this buffer size and allow the implementation
  // to pick a good buffer size to balance between latency and audio quality."
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
  // however, webkitAudioContext (safari) requires it to be set'
  // Possible values: 0 (use implementation-provided default), 256, 512, 1024, 2048, 4096, 8192, 16384
  return typeof window.AudioContext === "undefined" ? 4096 : 0;
}

type InitResults = {
  recorder:ScriptProcessorNode,
  sampleRate:number,
  bufferSize:number
}

async function _init():Promise<InitResults> {
  const mediaStream = await _getMicrophoneUserMedia();
  const context = await waitForTheAudioContext();
  const bestBufferSize = _getBestBufferSize();

  const inputChannels = 1; // Nearly every mic will be one channel.
  const outputChannels = 1; // Chrome is buggy and won't work without this.

  const recorder = context.createScriptProcessor(
    bestBufferSize,
    inputChannels,
    outputChannels
  );
  const bufferSize = recorder.bufferSize;

  recorder.connect(context.destination);

  const audioInput = context.createMediaStreamSource(mediaStream);
  audioInput.connect(recorder);

  return { recorder, sampleRate:context.sampleRate, bufferSize };
}

class Microphone {
  _recorder:ScriptProcessorNode | null;
  _onReceiveAudio:IReceiveAudioCallback;
  _sampleRate:number;
  _bufferSize:number;
  _isRecording:boolean;

  constructor(onReceiveAudio:IReceiveAudioCallback) {
    this._recorder = null;
    this._onReceiveAudio = onReceiveAudio;
    this._sampleRate = 0;
    this._bufferSize = 0;
    this._isRecording = false;
  }

  _onRecorderProcess = (e: AudioProcessingEvent) => { // onaudioprocess can be called at least once after we've stopped
    if (!this._isRecording || !this._recorder) return;
    const samples:Float32Array = e.inputBuffer.getChannelData(0);
    if (!samples.length) return;
    this._onReceiveAudio(samples, this._sampleRate);
  };

  async init() {
    const results = await _init();
    this._recorder = results.recorder;
    this._sampleRate = results.sampleRate;
    this._recorder.onaudioprocess = this._onRecorderProcess;
    this._bufferSize = results.bufferSize;
  }

  enable() {
    this._isRecording = true;
  }

  disable() {
    this._isRecording = false;
  }
  
  get bufferSize():number { return this._bufferSize; }
  get sampleRate():number { return this._sampleRate; }
  get isEnabled():boolean { return this._isRecording; }
}

export default Microphone;