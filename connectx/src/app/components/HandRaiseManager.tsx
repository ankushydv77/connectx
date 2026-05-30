"use client";

import { useState, useEffect } from "react";
import { Hand } from "lucide-react";

interface ParticipantWithHandRaise {
  socketId: string;
  userName: string;
  hasHandRaised: boolean;
  handRaisedAt?: Date;
}

interface HandRaiseManagerProps {
  participants: ParticipantWithHandRaise[];
  currentSocketId: string;
  onRaiseHand: () => void;
  onLowerHand: () => void;
  isHandRaised: boolean;
}

export function HandRaiseManager({
  participants,
  currentSocketId,
  onRaiseHand,
  onLowerHand,
  isHandRaised,
}: HandRaiseManagerProps) {
  const handsRaised = participants.filter((p) => p.hasHandRaised).sort((a, b) => {
    const timeA = a.handRaisedAt?.getTime() || 0;
    const timeB = b.handRaisedAt?.getTime() || 0;
    return timeA - timeB;
  });

  return (
    <div className="space-y-2">
      {/* Hand Raise Button */}
      <button
        onClick={isHandRaised ? onLowerHand : onRaiseHand}
        className={`rounded-full p-3 transition w-full flex items-center justify-center gap-2 text-sm font-medium ${
          isHandRaised
            ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50"
            : "bg-slate-900/50 hover:bg-slate-900/70 text-slate-200"
        }`}
        title={isHandRaised ? "Lower hand" : "Raise hand"}
      >
        <Hand className="w-4 h-4" />
        {isHandRaised ? "Lower Hand" : "Raise Hand"}
      </button>

      {/* Hands Raised List */}
      {handsRaised.length > 0 && (
        <div className="bg-yellow-950/30 border border-yellow-700/50 rounded-lg p-2 space-y-1">
          <p className="text-xs font-semibold text-yellow-400 uppercase px-1">
            Hands Raised ({handsRaised.length})
          </p>
          <div className="space-y-1">
            {handsRaised.map((p) => (
              <div
                key={p.socketId}
                className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 rounded text-xs"
              >
                <Hand className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-200">{p.userName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
