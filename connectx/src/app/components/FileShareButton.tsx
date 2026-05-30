"use client";

import { useRef, useState, useEffect } from "react";
import { FileUp, X } from "lucide-react";
import { MAX_FILE_SIZE } from "@/lib/fileUtils";

interface Participant {
  socketId: string;
  userName: string;
}

interface FileShareButtonProps {
  onFileSelected: (
    file: File,
    targetPeerId: string,
    onProgress: (progress: number) => void
  ) => Promise<void>;
  participants: Participant[];
  disabled?: boolean;
}

export function FileShareButton({
  onFileSelected,
  participants,
  disabled = false,
}: FileShareButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileClick = () => {
    if (disabled || isTransferring) return;
    setIsOpen(!isOpen);
    setError(""); // Clear any previous error when opening
  };

  // Auto-select peer if there is only one participant in the call
  useEffect(() => {
    if (participants.length === 1 && !selectedPeer) {
      setSelectedPeer(participants[0].socketId);
    }
  }, [participants, selectedPeer]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(false);
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
      return;
    }

    if (!selectedPeer) {
      setError("Please select a participant to share with");
      return;
    }

    setIsTransferring(true);
    setTransferProgress(0);

    try {
      await onFileSelected(file, selectedPeer, setTransferProgress);
      setTransferProgress(0);
      setSelectedPeer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "File transfer failed");
    } finally {
      setIsTransferring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      {/* File Share Button */}
      <button
        onClick={handleFileClick}
        disabled={disabled || isTransferring || participants.length === 0}
        className={`rounded-full p-3 transition ${
          disabled || isTransferring || participants.length === 0
            ? "bg-slate-800 text-slate-400 cursor-not-allowed"
            : "bg-slate-900/50 hover:bg-slate-900/70 text-slate-200 hover:text-cyan-400"
        }`}
        title="Share File"
      >
        <FileUp className="w-6 h-6" />
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        disabled={isTransferring}
      />

      {/* Peer Selection Dropdown */}
      {isOpen && participants.length > 0 && (
        <div className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 w-48 z-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-200">
              Send to:
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {participants.map((p) => (
              <label
                key={p.socketId}
                className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
              >
                <input
                  type="radio"
                  name="peer"
                  value={p.socketId}
                  checked={selectedPeer === p.socketId}
                  onChange={(e) => {
                    setSelectedPeer(e.target.value);
                  }}
                  className="cursor-pointer"
                />
                <span className="text-sm text-slate-200">{p.userName}</span>
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-950/30 p-2 rounded">
              {error}
            </div>
          )}

          {selectedPeer && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isTransferring}
              className="mt-3 w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white text-sm rounded font-medium transition"
            >
              {isTransferring
                ? `Sending... ${Math.round(transferProgress)}%`
                : "Select File"}
            </button>
          )}
        </div>
      )}

      {/* Empty state message */}
      {isOpen && participants.length === 0 && (
        <div className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 w-48 text-xs text-slate-400">
          No other participants to share with
        </div>
      )}
    </div>
  );
}
