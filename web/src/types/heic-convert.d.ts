declare module "heic-convert" {
  interface ConvertOptions {
    /** Raw bytes of the HEIC/HEIF image. */
    buffer: Buffer | Uint8Array;
    /** Output format. */
    format: "JPEG" | "PNG";
    /** JPEG quality 0–1 (ignored for PNG). */
    quality?: number;
  }
  /** Convert a HEIC/HEIF buffer to JPEG/PNG, resolving to the output bytes. */
  function convert(options: ConvertOptions): Promise<ArrayBuffer>;
  export = convert;
}
