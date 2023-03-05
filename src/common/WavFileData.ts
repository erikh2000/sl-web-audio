import WavCue from "./WavCue";

export type WavFileData = {
  filename:string,
  audioBuffer:AudioBuffer,
  cues:WavCue[]
}
export default WavFileData;