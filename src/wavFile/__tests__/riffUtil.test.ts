import {  readUint32LE, readChunkId, readNullTerminatedAscii, textToNullTerminatedAscii, findWavChunk } from '../riffUtil';
import { wavBytes as exampleWavBytes } from '../__testWavs__/exampleWavBytes';

describe('readUint32LE', () => {
  describe('readUint32LE()', () => {
    it('reads a 32-bit unsigned integer', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, 0x12345678, true);
      const expected = 0x12345678;
      const actual = readUint32LE(new Uint8Array(buffer), 0);
      expect(actual).toEqual(expected);
    });

    it('reads 0x00000000', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, 0x00000000, true);
      const expected = 0x00000000;
      const actual = readUint32LE(new Uint8Array(buffer), 0);
      expect(actual).toEqual(expected);
    });

    it('reads 0xffffffff', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, 0xffffffff, true);
      const expected = 0xffffffff;
      const actual = readUint32LE(new Uint8Array(buffer), 0);
      expect(actual).toEqual(expected);
    });
  });
  
  describe('readChunkId()', () => {
    it('reads a chunk ID', () => {
      const buffer = new ArrayBuffer(6);
      const view = new DataView(buffer);
      view.setUint8(0, 0x41);
      view.setUint8(1, 0x42);
      view.setUint8(2, 0x43);
      view.setUint8(3, 0x44);
      view.setUint8(4, 0x45); // This byte is ignored.
      view.setUint8(5, 0x46); // This byte is ignored.
      const expected = 'ABCD';
      const actual = readChunkId(new Uint8Array(buffer), 0);
      expect(actual).toEqual(expected);
    });
  });
  
  describe('readNullTerminatedAscii()', () => {
    it('reads an empty string', () => {
      const buffer = new ArrayBuffer(1);
      const view = new DataView(buffer);
      view.setUint8(0, 0x00);
      const expected = '';
      const actual = readNullTerminatedAscii(new Uint8Array(buffer), 0, 1);
      expect(actual).toEqual(expected);
    });
    
    it('reads an empty string for an empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const expected = '';
      const actual = readNullTerminatedAscii(new Uint8Array(buffer), 0, 0);
      expect(actual).toEqual(expected);
    });

    it('reads a null-terminated ASCII string', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint8(0, 0x41);
      view.setUint8(1, 0x42);
      view.setUint8(2, 0x43);
      view.setUint8(3, 0x00);
      const expected = 'ABC';
      const actual = readNullTerminatedAscii(new Uint8Array(buffer), 0, 4);
      expect(actual).toEqual(expected);
    });
    
    it('reads a null-terminated string within a larger buffer', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint8(0, 0x41);
      view.setUint8(1, 0x42);
      view.setUint8(2, 0x43);
      view.setUint8(3, 0x00);
      view.setUint8(4, 0x44);
      view.setUint8(5, 0x45);
      view.setUint8(6, 0x46);
      view.setUint8(7, 0x00);
      const expected = 'ABC';
      const actual = readNullTerminatedAscii(new Uint8Array(buffer), 0, 8);
      expect(actual).toEqual(expected);
    });
    
    it('reads to end of buffer when null terminator is not found', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint8(0, 0x41);
      view.setUint8(1, 0x42);
      view.setUint8(2, 0x43);
      view.setUint8(3, 0x44);
      const expected = 'ABCD';
      const actual = readNullTerminatedAscii(new Uint8Array(buffer), 0, 4);
      expect(actual).toEqual(expected);
    });
  });
  
  describe('textToNullTerminatedAscii()', () => {
    it('converts an empty string to null-terminated ASCII', () => {
      const expected = new Uint8Array([0x00]);
      const actual = textToNullTerminatedAscii('');
      expect(actual).toEqual(expected);
    });
    
    it('converts a string to null-terminated ASCII', () => {
      const expected = new Uint8Array([0x41, 0x42, 0x43, 0x00]);
      const actual = textToNullTerminatedAscii('ABC');
      expect(actual).toEqual(expected);
    });
  });
  
  describe('findWavChunk()', () => {
    it('finds the FMT chunk', () => {
      const expectedLength = 16;
      const actual = findWavChunk(exampleWavBytes, 'fmt ');
      expect(actual?.length ?? 0).toEqual(expectedLength);
    });

    it('finds the DATA chunk', () => {
      const expectedLength = 31020;
      const actual = findWavChunk(exampleWavBytes, 'data');
      expect(actual?.length ?? 0).toEqual(expectedLength);
    });
    
    it('returns null when chunk is not found', () => {
      const actual = findWavChunk(exampleWavBytes, 'abcd');
      expect(actual).toBeNull();
    });
  });
});