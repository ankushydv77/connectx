"use client";

import React from "react";
import { Mic, MicOff, Video, VideoOff, Hand } from "lucide-react";

interface Participant {
  socketId: string;
  userName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  videoStream?: MediaStream;
  hasHandRaised?: boolean;
  handRaisedAt?: Date;
}

interface ParticipantGridProps {
  participants: Participant[];
  maxVisible?: number;
}

export function ParticipantGrid({
  participants,
  maxVisible = 6,
}: ParticipantGridProps) {
  const displayParticipants = participants.slice(0, maxVisible);
  const hiddenCount = Math.max(0, participants.length - maxVisible);

  // Determine grid layout based on participant count
  const getGridClass = () => {
    const count = displayParticipants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "sm:grid-cols-2 lg:grid-cols-2";
    if (count <= 4) return "sm:grid-cols-2 lg:grid-cols-2";
    if (count <= 6) return "sm:grid-cols-2 lg:grid-cols-3";
    return "sm:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${getGridClass()}`}>
        {displayParticipants.map((participant) => (
          <ParticipantCard
            key={participant.socketId}
            participant={participant}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="text-center text-sm text-slate-400 py-2">
          +{hiddenCount} more participant{hiddenCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

interface ParticipantCardProps {
  participant: Participant;
}

function ParticipantCard({ participant }: ParticipantCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-md aspect-video group transition duration-300 hover:shadow-lg">
      {/* Video Stream */}
      {!participant.isVideoOff && participant.videoStream ? (
        <VideoStreamElement stream={participant.videoStream} muted={participant.socketId === "self"} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <VideoOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Video off</p>
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="font-semibold text-white text-sm">
              {participant.userName}
            </p>
          </div>
          <div className="flex gap-2">
            {participant.isMuted ? (
              <MicOff className="w-4 h-4 text-red-500" />
            ) : (
              <Mic className="w-4 h-4 text-emerald-500" />
            )}
            {participant.isVideoOff ? (
              <VideoOff className="w-4 h-4 text-red-500" />
            ) : (
              <Video className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-3 right-3 flex gap-2">
        {participant.hasHandRaised && (
          <div className="bg-amber-100/90 backdrop-blur-sm rounded-full p-2 border border-amber-200 shadow-sm animate-pulse" title="Hand Raised">
            <Hand className="w-4 h-4 text-amber-600" />
          </div>
        )}
        {participant.isMuted && (
          <div className="bg-red-50/90 backdrop-blur-sm rounded-full p-2 border border-red-100 shadow-sm">
            <MicOff className="w-4 h-4 text-red-500" />
          </div>
        )}
        {participant.isVideoOff && (
          <div className="bg-red-50/90 backdrop-blur-sm rounded-full p-2 border border-red-100 shadow-sm">
            <VideoOff className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Name Badge */}
      <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200/60 backdrop-blur-md rounded-full px-3 py-1 shadow-sm">
        <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
          {participant.userName}
        </p>
      </div>
    </div>
  );
}

// Video Stream Element Component
interface VideoStreamElementProps {
  stream: MediaStream;
  muted?: boolean;
}

function VideoStreamElement({ stream, muted = false }: VideoStreamElementProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => null);
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      muted={muted}
      autoPlay
      playsInline
    />
  );
}
