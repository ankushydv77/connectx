"use client";

import { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Copy, Check, Sparkles } from "lucide-react";
import { useVirtualBackground, VirtualBackgroundType } from "./VirtualBackgroundManager";

interface WaitingRoomProps {
  roomId: string;
  userName: string;
  onJoinSuccess: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  activeBackground: VirtualBackgroundType;
  onChangeBackground: (bg: VirtualBackgroundType) => void;
  isGuest?: boolean;
  onNameChange?: (name: string) => void;
  isVideoOn?: boolean;
  isMicOn?: boolean;
  onToggleVideo?: () => void;
  onToggleMic?: () => void;
}

export function WaitingRoom({
  roomId,
  userName,
  onJoinSuccess,
  videoRef,
  activeBackground,
  onChangeBackground,
  isGuest = false,
  onNameChange,
  isVideoOn,
  isMicOn: isMicOnProp,
  onToggleVideo,
  onToggleMic,
}: WaitingRoomProps) {
  const [localCameraOn, setLocalCameraOn] = useState(true);
  const [localMicOn, setLocalMicOn] = useState(true);

  const isCameraOn = isVideoOn !== undefined ? isVideoOn : localCameraOn;
  const isMicOn = isMicOnProp !== undefined ? isMicOnProp : localMicOn;

  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);
  const [editedName, setEditedName] = useState(userName);

  // Sync editedName when userName changes
  useEffect(() => {
    setEditedName(userName);
  }, [userName]);

  const streamRef = useRef<MediaStream | null>(null);

  // Apply virtual background to the lobby stream
  const { processedStream } = useVirtualBackground(lobbyStream, activeBackground);

  // Initialize camera preview
  useEffect(() => {
    const initCamera = async () => {
      try {
        if (!isCameraOn) {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setLobbyStream(null);
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: isMicOn,
          });
          streamRef.current = stream;
          setLobbyStream(stream);
        } catch (videoErr) {
          console.warn("Lobby: Failed to access camera, trying audio-only fallback:", videoErr);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: isMicOn,
            });
            streamRef.current = stream;
            setLobbyStream(stream);
          } catch (audioErr) {
            console.error("Lobby: Failed to access audio too:", audioErr);
          }
        }
      } catch (err) {
        console.error("Failed to initialize lobby devices:", err);
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn, isMicOn]);

  // Update video element source whenever the processed stream changes
  useEffect(() => {
    if (videoRef.current && processedStream) {
      videoRef.current.srcObject = processedStream;
      videoRef.current.play().catch(() => null);
    }
  }, [processedStream, videoRef]);

  const toggleCamera = () => {
    if (onToggleVideo) {
      onToggleVideo();
    } else {
      setLocalCameraOn(!localCameraOn);
    }
  };

  const toggleMic = () => {
    if (onToggleMic) {
      onToggleMic();
    } else {
      setLocalMicOn(!localMicOn);
    }
  };

  const handleJoin = () => {
    setIsLoading(true);
    // Simulate joining (actual join happens in parent)
    setTimeout(() => {
      onJoinSuccess();
      setIsLoading(false);
    }, 1000);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300 mb-2">
              Ready to join?
            </p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Meeting Lobby
            </h1>
            <p className="text-slate-400 text-lg">
              Check your audio and video before joining
            </p>
          </div>

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Video Preview */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  playsInline
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={toggleCamera}
                  className={`rounded-lg px-4 py-3 font-medium transition flex items-center justify-center gap-2 ${
                    isCameraOn
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  }`}
                >
                  {isCameraOn ? (
                    <>
                      <Video className="w-4 h-4" />
                      Camera on
                    </>
                  ) : (
                    <>
                      <VideoOff className="w-4 h-4" />
                      Camera off
                    </>
                  )}
                </button>

                <button
                  onClick={toggleMic}
                  className={`rounded-lg px-4 py-3 font-medium transition flex items-center justify-center gap-2 ${
                    isMicOn
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  }`}
                >
                  {isMicOn ? (
                    <>
                      <Mic className="w-4 h-4" />
                      Mic on
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      Mic off
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowBgMenu(!showBgMenu)}
                  disabled={!isCameraOn}
                  className={`rounded-lg px-3 py-3 font-medium transition flex items-center justify-center gap-1.5 ${
                    !isCameraOn
                      ? "bg-slate-900/20 text-slate-600 cursor-not-allowed"
                      : showBgMenu
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        : "bg-slate-900/50 hover:bg-slate-900/70 text-slate-200 border border-slate-700"
                  }`}
                  title="Background Effects"
                >
                  <Sparkles className="w-4 h-4" />
                  Backgrounds
                </button>
              </div>

              {/* Background Picker popover */}
              {showBgMenu && isCameraOn && (
                <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 grid grid-cols-4 sm:grid-cols-7 gap-2 animate-fadeIn">
                  {[
                    { id: "none", label: "None", style: "bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px]" },
                    { id: "blur-low", label: "Low Blur", style: "bg-slate-800/80 backdrop-blur-[4px] border border-slate-700" },
                    { id: "blur-medium", label: "Normal Blur", style: "bg-slate-800/60 backdrop-blur-[12px] border border-slate-700" },
                    { id: "blur-high", label: "Deep Blur", style: "bg-slate-800/40 backdrop-blur-[24px] border border-slate-700" },
                    { id: "modern_office", label: "Office", style: "bg-[url('/backgrounds/modern_office.png')] bg-cover bg-center border border-slate-700" },
                    { id: "cyberpunk_room", label: "Cyberpunk", style: "bg-[url('/backgrounds/cyberpunk_room.png')] bg-cover bg-center border border-slate-700" },
                    { id: "gradient_mesh", label: "Gradient", style: "bg-[url('/backgrounds/gradient_mesh.png')] bg-cover bg-center border border-slate-700" },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => onChangeBackground(bg.id as any)}
                      className={`flex flex-col items-center gap-1 p-1 rounded-lg transition border text-center ${
                        activeBackground === bg.id
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-400 font-semibold"
                          : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className={`w-full h-8 rounded-md relative flex items-center justify-center ${bg.style}`}>
                        {bg.id === "none" && <span className="text-[10px]">🚫</span>}
                      </div>
                      <span className="text-[10px] font-medium truncate w-full">{bg.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* User Info */}
              <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
                  Your Details
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Name</p>
                    {isGuest ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => {
                          setEditedName(e.target.value);
                          onNameChange?.(e.target.value);
                        }}
                        placeholder="Enter your name to join..."
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                    ) : (
                      <p className="font-semibold text-white">{userName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Room Code</p>
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
                      <code className="text-sm font-mono text-cyan-400 flex-1 truncate">
                        {roomId}
                      </code>
                      <button
                        onClick={copyRoomCode}
                        className="text-slate-400 hover:text-white transition"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
                  Tips
                </p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Test your camera and microphone</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Find a quiet space for better audio</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Share the room code with others</span>
                  </li>
                </ul>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Joining..." : "Join Meeting"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
