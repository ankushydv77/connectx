"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export interface Caption {
  id: string;
  speakerName: string;
  originalText: string;
  originalLanguage: string;
  translations: Record<string, string>;
  timestamp: Date;
  isInterim: boolean;
}

interface CaptionDisplayProps {
  captions: Caption[];
  currentUserLanguage: string;
  isListening: boolean;
  onClearCaptions?: () => void;
}

export function CaptionDisplay({
  captions,
  currentUserLanguage,
  isListening,
  onClearCaptions,
}: CaptionDisplayProps) {
  const [displayedCaptions, setDisplayedCaptions] = useState<Caption[]>([]);

  // Keep only last 5 captions for clean UI
  useEffect(() => {
    setDisplayedCaptions(captions.slice(-5));
  }, [captions]);

  if (displayedCaptions.length === 0 && !isListening) {
    return null;
  }

  return (
    <div className="fixed bottom-32 left-4 right-4 max-w-2xl mx-auto z-30">
      {/* Caption Container */}
      <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isListening ? "bg-cyan-400 animate-pulse" : "bg-slate-600"
              }`}
            />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Live Captions
            </span>
          </div>
          {onClearCaptions && (
            <button
              onClick={onClearCaptions}
              className="text-slate-400 hover:text-white transition"
              title="Clear captions"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Captions */}
        <div className="space-y-3">
          {displayedCaptions.map((caption) => (
            <div key={caption.id} className="space-y-1">
              {/* Speaker Name + Timestamp */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">
                  {caption.speakerName}
                </span>
                <span className="text-xs text-slate-500">
                  {caption.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {/* Original Text */}
              <div className="text-sm text-slate-200 leading-relaxed">
                <span className="text-xs text-slate-400 italic">
                  [{caption.originalLanguage}]
                </span>{" "}
                {caption.originalText}
                {caption.isInterim && (
                  <span className="text-slate-500 animate-pulse">▌</span>
                )}
              </div>

              {/* Translated Text (if different language) */}
              {currentUserLanguage &&
                currentUserLanguage !==
                  caption.originalLanguage &&
                caption.translations[currentUserLanguage] && (
                  <div className="text-sm text-slate-300 pl-2 border-l-2 border-cyan-500/30 leading-relaxed">
                    <span className="text-xs text-slate-400 italic">
                      [{currentUserLanguage}]
                    </span>{" "}
                    {caption.translations[currentUserLanguage]}
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Listening Indicator */}
        {isListening && displayedCaptions.length === 0 && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-slate-400">Listening</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
                <div
                  className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
