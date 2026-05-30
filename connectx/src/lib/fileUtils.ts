// File transfer utilities with chunking and hashing

export const CHUNK_SIZE = 64 * 1024; // 64KB per chunk
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export interface FileChunk {
  type: "file_chunk";
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
}

export interface FileOffer {
  type: "file_offer";
  fileId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;
}

export interface FileComplete {
  type: "file_complete";
  fileId: string;
  fileName: string;
  fileHash: string;
}

export interface FileReady {
  type: "file_ready";
  fileId: string;
}

export interface FileReceived {
  type: "file_received";
  fileId: string;
}

export interface FileError {
  type: "file_error";
  fileId: string;
  error: string;
}

export async function calculateSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function chunkFile(file: File): Blob[] {
  const chunks: Blob[] = [];
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    chunks.push(file.slice(offset, end));
    offset = end;
  }

  return chunks;
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(e.target.result);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function arrayBufferToBlob(
  buffer: ArrayBuffer,
  mimeType: string = "application/octet-stream"
): Blob {
  return new Blob([buffer], { type: mimeType });
}

export function generateFileId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

