declare module 'msgpack-js' {
  export function encode(data: any): Buffer;
  export function decode(buffer: Buffer | Uint8Array): any;
}