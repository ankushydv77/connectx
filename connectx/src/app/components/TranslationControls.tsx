"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/translationService";

interface TranslationControlsProps {
  isListening: boolean;
  selectedLanguage: string;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

export function TranslationControls({
  isListening,
  selectedLanguage,
  isSupported,
  onStartListening,
  onStopListening,
  onLanguageChange,
  disabled = false,
}: TranslationControlsProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  if (!isSupported) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 px-3 py-2 rounded">
        Speech recognition not supported in your browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Microphone Button */}
      <button
        onClick={isListening ? onStopListening : onStartListening}
        disabled={disabled}
        className={`rounded-full p-3 transition relative ${
          isListening
            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 animate-pulse"
            : "bg-slate-900/50 hover:bg-slate-900/70 text-slate-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title={isListening ? "Stop listening" : "Start speech recognition"}
      >
        {isListening ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
        {isListening && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="px-3 py-2 bg-slate-900/50 hover:bg-slate-900/70 text-slate-200 text-sm rounded-lg transition border border-slate-700"
          title="Select language"
        >
          {SUPPORTED_LANGUAGES[selectedLanguage] || selectedLanguage}
        </button>

        {showLanguageMenu && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 min-w-48 z-50 max-h-60 overflow-y-auto">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  onLanguageChange(code);
                  setShowLanguageMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition ${
                  selectedLanguage === code
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                    : "text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
