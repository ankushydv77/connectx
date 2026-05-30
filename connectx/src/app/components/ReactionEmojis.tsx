"use client";

import { useEffect, useState } from "react";

export const REACTION_EMOJIS = ["👍", "🎉", "❤️", "😂", "🔥", "🤔"];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface ReactionDisplayProps {
  reactions: FloatingReaction[];
}

interface ReactionSendProps {
  onSendReaction: (emoji: string) => void;
}

export function ReactionDisplay({ reactions }: ReactionDisplayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="fixed text-4xl font-bold animate-bounce"
          style={{
            left: `${reaction.x}px`,
            top: `${reaction.y}px`,
            animation: `floatUp 3s ease-out forwards`,
          }}
        >
          {reaction.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

export function ReactionButtons({ onSendReaction }: ReactionSendProps) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowReactions(!showReactions)}
        className="rounded-full p-2 bg-slate-900/50 hover:bg-slate-900/70 text-slate-200 transition"
        title="Send reaction"
      >
        <span className="text-xl">😊</span>
      </button>

      {showReactions && (
        <div className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700 rounded-lg p-2 flex gap-1 shadow-lg">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSendReaction(emoji);
                setShowReactions(false);
              }}
              className="text-2xl hover:scale-150 transition transform"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
