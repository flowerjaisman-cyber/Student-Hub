declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export interface HtmlResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { path: string } | { buffer: Buffer },
    options?: any
  ): Promise<HtmlResult>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { path: string } | { buffer: Buffer }
  ): Promise<RawTextResult>;
}
