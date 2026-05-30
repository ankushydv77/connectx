"use client";

import { Download, X, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface FileTransferState {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;
  progress: number;
  chunks: Map<number, ArrayBuffer>;
  status: "pending" | "downloading" | "complete" | "error";
  error?: string;
  senderName?: string;
  targetPeerId?: string;
}

interface FileTransferProgressProps {
  incomingFiles: Map<string, FileTransferState> | undefined;
  onAccept: (fileId: string) => void;
  onReject: (fileId: string) => void;
  onDownload: (fileId: string) => void;
}

export function FileTransferProgress({
  incomingFiles,
  onAccept,
  onReject,
  onDownload,
}: FileTransferProgressProps) {
  const files = incomingFiles ? Array.from(incomingFiles.values()) : [];

  if (files.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-80 space-y-2 z-40">
      {files.map((file) => (
        <div
          key={file.fileId}
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 w-full sm:w-80 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {file.fileName}
              </p>
              <p className="text-xs text-slate-400">
                from {file.senderName || "Unknown"} (
                {(file.fileSize / 1024 / 1024).toFixed(2)}MB)
              </p>
            </div>
            {file.status !== "downloading" && (
              <button
                onClick={() => onReject(file.fileId)}
                className="text-slate-400 hover:text-red-400 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status-specific content */}
          {file.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(file.fileId)}
                className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded font-medium transition"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(file.fileId)}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded font-medium transition"
              >
                Reject
              </button>
            </div>
          )}

          {file.status === "downloading" && (
            <div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-cyan-500 h-full transition-all"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                {Math.round(file.progress)}%
              </p>
            </div>
          )}

          {file.status === "complete" && (
            <button
              onClick={() => onDownload(file.fileId)}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}

          {file.status === "error" && (
            <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded">
              {file.error || "Transfer failed"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
