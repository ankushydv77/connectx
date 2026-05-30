"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isSystemMessage?: boolean;
}

interface MeetingChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (text: string) => void;
  onClose?: () => void;
}

export function MeetingChat({
  messages,
  currentUserId,
  currentUserName,
  onSendMessage,
  onClose,
}: MeetingChatProps) {
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700 flex flex-col rounded-l-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 rounded-tl-xl">
        <h2 className="text-lg font-bold text-slate-100">Meeting Chat</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center">
            <div>
              <p>No messages yet</p>
              <p className="text-xs mt-2 text-slate-600">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === currentUserId
                    ? "bg-cyan-600/80 text-white rounded-br-none"
                    : msg.isSystemMessage
                      ? "bg-slate-700/50 text-slate-300 italic text-xs w-full text-center"
                      : "bg-slate-700/60 text-slate-100 rounded-bl-none"
                }`}
              >
                {!msg.isSystemMessage && (
                  <p className="text-xs font-semibold text-slate-200 mb-0.5">
                    {msg.senderId === currentUserId ? "You" : msg.senderName}
                  </p>
                )}
                <p className="text-sm break-words whitespace-pre-wrap">
                  {msg.text}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-bl-xl">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-slate-800 text-white text-sm rounded border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none max-h-20"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded transition flex items-center justify-center"
            title="Send message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Press Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
