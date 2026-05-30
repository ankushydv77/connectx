"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  X,
  MessageSquare,
  Users,
  Grid3X3,
  Focus,
  Copy,
  Check,
  Sparkles,
  Hand,
  Files,
} from "lucide-react";
import { useState } from "react";
import { ParticipantGrid } from "./ParticipantGrid";
import { FileShareButton } from "./FileShareButton";
import { FileTransferProgress } from "./FileTransferProgress";
import { ReactionButtons } from "./ReactionEmojis";

interface Participant {
  socketId: string;
  userName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  videoStream?: MediaStream;
  hasHandRaised?: boolean;
  handRaisedAt?: Date;
}

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

interface VideoCallInterfaceProps {
  roomId: string;
  participants: Participant[];
  myStream: MediaStream | null;
  isVideoOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeaveCall: () => void;
  onToggleChat: () => void;
  onToggleParticipants?: () => void;
  onToggleBackgroundPicker?: () => void;
  onToggleFiles?: () => void;
  onFileSelected?: (
    file: File,
    targetPeerId: string,
    onProgress: (progress: number) => void
  ) => Promise<void>;
  incomingFiles?: Map<string, FileTransferState>;
  onAcceptFile?: (fileId: string) => void;
  onRejectFile?: (fileId: string) => void;
  onDownloadFile?: (fileId: string) => void;
  isHandRaised?: boolean;
  onRaiseHand?: () => void;
  onLowerHand?: () => void;
  onSendReaction?: (emoji: string) => void;
  isGuest?: boolean;
}

export function VideoCallInterface({
  roomId,
  participants,
  myStream,
  isVideoOn,
  isMicOn,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveCall,
  onToggleChat,
  onToggleParticipants,
  onToggleBackgroundPicker,
  onToggleFiles,
  onFileSelected,
  incomingFiles = new Map(),
  onAcceptFile,
  onRejectFile,
  onDownloadFile,
  isHandRaised = false,
  onRaiseHand = () => {},
  onLowerHand = () => {},
  onSendReaction = () => {},
  isGuest = false,
}: VideoCallInterfaceProps) {
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("gallery");
  const [isCopied, setIsCopied] = useState(false);

  const allParticipants: Participant[] = [
    {
      socketId: "self",
      userName: "You",
      isMuted: !isMicOn,
      isVideoOff: !isVideoOn,
      videoStream: myStream || undefined,
      hasHandRaised: isHandRaised,
    },
    ...participants,
  ];

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderVideoView = () => {
    if (viewMode === "gallery") {
      return <ParticipantGrid participants={allParticipants} />;
    }

    // Speaker view: large speaker + thumbnails
    const speaker = allParticipants[0];
    const others = allParticipants.slice(1);

    return (
      <div className="space-y-4">
        {/* Main Speaker */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 aspect-video h-96">
          {speaker.videoStream ? (
            <video
              ref={(video) => {
                if (video) {
                  (video as any).srcObject = speaker.videoStream;
                }
              }}
              className="w-full h-full object-cover"
              muted={speaker.socketId === "self"}
              autoPlay
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="text-center">
                <VideoOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">{speaker.userName}</p>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            {speaker.hasHandRaised && (
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-full p-2 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse" title="Hand Raised">
                <Hand className="w-4 h-4 text-amber-400" />
              </div>
            )}
            {speaker.isMuted && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-2 border border-red-500/30">
                <MicOff className="w-4 h-4 text-red-400" />
              </div>
            )}
          </div>

          {/* Name Badge */}
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
            <p className="text-xs font-medium text-white">
              {speaker.userName}
            </p>
          </div>
        </div>

        {/* Thumbnails */}
        {others.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {others.map((participant) => (
              <div
                key={participant.socketId}
                className="flex-shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-white/10 w-32 h-24"
              >
                {participant.videoStream ? (
                  <video
                    ref={(video) => {
                      if (video) {
                        (video as any).srcObject = participant.videoStream;
                      }
                    }}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <VideoOff className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-800">
      {/* Main Content */}
      <div className="container mx-auto p-3 sm:p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 flex-shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-850">Meeting in progress</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1 font-medium">
              {allParticipants.length} participant
              {allParticipants.length !== 1 ? "s" : ""} connected
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            {/* View Mode Switcher */}
            <div className="flex gap-1.5 bg-slate-200/60 border border-slate-300/40 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("gallery")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs sm:text-sm font-semibold ${
                  viewMode === "gallery"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                Gallery
              </button>
              <button
                onClick={() => setViewMode("speaker")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs sm:text-sm font-semibold ${
                  viewMode === "speaker"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Focus className="w-3.5 h-3.5" />
                Speaker
              </button>
            </div>

            {/* Room Code */}
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 transition shadow-sm"
            >
              <code className="font-mono text-cyan-600">{roomId}</code>
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-cyan-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Video Grid/View */}
        <div className="flex-1 overflow-auto mb-6 rounded-lg">
          {renderVideoView()}
        </div>

        {/* Control Bar */}
        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-slate-200 bg-white/40 backdrop-blur-md rounded-2xl p-2 sm:p-3 shadow-sm">
          {/* Mic Control */}
          <button
            onClick={onToggleMic}
            className={`rounded-full p-2.5 sm:p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isMicOn
                ? "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
                : "bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 shadow-sm"
            }`}
            title={isMicOn ? "Mute" : "Unmute"}
          >
            {isMicOn ? (
              <Mic className="w-5 h-5 sm:w-6 h-6" />
            ) : (
              <MicOff className="w-5 h-5 sm:w-6 h-6" />
            )}
          </button>

          {/* Video Control */}
          <button
            onClick={onToggleVideo}
            className={`rounded-full p-2.5 sm:p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isVideoOn
                ? "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
                : "bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 shadow-sm"
            }`}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5 sm:w-6 h-6" />
            ) : (
              <VideoOff className="w-5 h-5 sm:w-6 h-6" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`rounded-full p-2.5 sm:p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isScreenSharing
                ? "bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200 shadow-sm"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
            }`}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            {isScreenSharing ? (
              <X className="w-5 h-5 sm:w-6 h-6" />
            ) : (
              <Share2 className="w-5 h-5 sm:w-6 h-6" />
            )}
          </button>

          {/* File Share */}
          {!isGuest && onFileSelected && (
            <FileShareButton
              onFileSelected={onFileSelected}
              participants={participants}
              disabled={isScreenSharing}
            />
          )}

          {/* Virtual Background */}
          {onToggleBackgroundPicker && (
            <button
              onClick={onToggleBackgroundPicker}
              disabled={!isVideoOn}
              className={`rounded-full p-2.5 sm:p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
                !isVideoOn
                  ? "bg-slate-50 text-slate-350 cursor-not-allowed border border-slate-100"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
              }`}
              title="Virtual Backgrounds"
            >
              <Sparkles className="w-5 h-5 sm:w-6 h-6" />
            </button>
          )}

          {/* Hand Raise */}
          <button
            onClick={isHandRaised ? onLowerHand : onRaiseHand}
            className={`rounded-full p-2.5 sm:p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
              isHandRaised
                ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 shadow-sm animate-bounce"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="w-5 h-5 sm:w-6 h-6" />
          </button>

          {/* Reactions */}
          <ReactionButtons onSendReaction={onSendReaction} />

          {/* Participants */}
          {onToggleParticipants && (
            <button
              onClick={onToggleParticipants}
              className="rounded-full p-2.5 sm:p-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
              title="Participants"
            >
              <Users className="w-5 h-5 sm:w-6 h-6" />
            </button>
          )}

          {/* Chat */}
          <button
            onClick={onToggleChat}
            className="rounded-full p-2.5 sm:p-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
            title="Chat"
          >
            <MessageSquare className="w-5 h-5 sm:w-6 h-6" />
          </button>

          {/* Shared Files */}
          {onToggleFiles && (
            <button
              onClick={onToggleFiles}
              className="rounded-full p-2.5 sm:p-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:text-cyan-600"
              title="Shared Files"
            >
              <Files className="w-5 h-5 sm:w-6 h-6" />
            </button>
          )}

          {/* Leave Call */}
          <button
            onClick={onLeaveCall}
            className="rounded-full p-2.5 sm:p-3 bg-red-500 hover:bg-red-655 text-white shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ml-2 sm:ml-4"
            title="Leave meeting"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 h-6" />
          </button>
        </div>
      </div>

      {/* File Transfer Progress */}
      {incomingFiles && (
        <FileTransferProgress
          incomingFiles={incomingFiles}
          onAccept={onAcceptFile || (() => {})}
          onReject={onRejectFile || (() => {})}
          onDownload={onDownloadFile || (() => {})}
        />
      )}
    </div>
  );
}
