"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { WaitingRoom } from "@/app/components/WaitingRoom";
import { VideoCallInterface } from "@/app/components/VideoCallInterface";
import { CaptionDisplay, Caption } from "@/app/components/CaptionDisplay";
import { TranslationControls } from "@/app/components/TranslationControls";
import { MeetingChat, ChatMessage } from "@/app/components/MeetingChat";
import { HandRaiseManager } from "@/app/components/HandRaiseManager";
import { ReactionDisplay, ReactionButtons, REACTION_EMOJIS } from "@/app/components/ReactionEmojis";
import { BackgroundPicker, useVirtualBackground, VirtualBackgroundType } from "@/app/components/VirtualBackgroundManager";
import { getCurrentUser } from "@/lib/auth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  translateToMultipleLanguages,
  SUPPORTED_LANGUAGES,
  debounceTranslation,
} from "@/lib/translationService";
import {
  calculateSHA256,
  fileToArrayBuffer,
  generateFileId,
  CHUNK_SIZE,
  FileOffer,
  FileChunk,
  FileComplete,
  FileReady,
  FileReceived,
  FileError,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "@/lib/fileUtils";

interface Participant {
  socketId: string;
  userName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  videoStream?: MediaStream;
  hasHandRaised?: boolean;
  handRaisedAt?: Date;
}

interface RTCPeerData {
  peerConnection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  videoStream?: MediaStream;
  candidateQueue?: any[];
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

export default function ImprovedMeetPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [status, setStatus] = useState("initializing"); // initializing, waiting, connected
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [incomingFiles, setIncomingFiles] = useState<
    Map<string, FileTransferState>
  >(new Map());
  const [outgoingFile, setOutgoingFile] = useState<FileTransferState | null>(
    null
  );
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-US");
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeBackground, setActiveBackground] = useState<VirtualBackgroundType>("none");
  const [activeSidebar, setActiveSidebar] = useState<"none" | "chat" | "participants" | "backgrounds" | "files">("none");
  const [sharedFiles, setSharedFiles] = useState<FileTransferState[]>([]);
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [fileTab, setFileTab] = useState<"all" | "received" | "sent">("all");
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<
    Array<{ id: string; emoji: string; x: number; y: number }>
  >([]);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerData>>(new Map());
  const queuedCandidatesRef = useRef<Map<string, any[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const localStreamPromiseRef = useRef<Promise<MediaStream | null> | null>(null);
  const fileTransfersRef = useRef<Map<string, FileTransferState>>(new Map());
  const statusRef = useRef(status);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const isVideoOnRef = useRef(isVideoOn);
  const isMicOnRef = useRef(isMicOn);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isVideoOnRef.current = isVideoOn;
  }, [isVideoOn]);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  // Initialize
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setCurrentUser({
        id: `guest-${Math.random().toString(36).substring(2, 8)}`,
        name: "Guest",
        email: "guest@connectx.com",
        isGuest: true,
      });
    } else {
      setCurrentUser(user);
    }

    const params = new URLSearchParams(window.location.search);
    const room = params.get("room") || generateRoomId();
    setRoomId(room);
  }, [router]);

  // Socket.io Connection
  useEffect(() => {
    if (!currentUser || !roomId) return;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    const newSocket = io(backendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to signaling server");
      setSocket(newSocket);
      socketRef.current = newSocket;
    });

    newSocket.on("room_state", (data: any) => {
      console.log("Room state:", data);
      const others = (data.participants || []).filter(
        (p: any) => p.socketId !== newSocket.id
      );
      setParticipants((prev) => {
        return others.map((newP: Participant) => {
          const oldP = prev.find((p) => p.socketId === newP.socketId);
          const peer = peersRef.current.get(newP.socketId);
          return oldP 
            ? { ...oldP, ...newP, videoStream: oldP.videoStream || peer?.videoStream || newP.videoStream } 
            : { ...newP, videoStream: peer?.videoStream || newP.videoStream };
        });
      });
    });

    newSocket.on("participant_joined", async (data: any) => {
      console.log("Participant joined:", data);
      const others = (data.participants || []).filter(
        (p: any) => p.socketId !== newSocket.id
      );
      setParticipants((prev) => {
        return others.map((newP: Participant) => {
          const oldP = prev.find((p) => p.socketId === newP.socketId);
          const peer = peersRef.current.get(newP.socketId);
          return oldP 
            ? { ...oldP, ...newP, videoStream: oldP.videoStream || peer?.videoStream || newP.videoStream } 
            : { ...newP, videoStream: peer?.videoStream || newP.videoStream };
        });
      });

      // If we are already connected and this participant is not us, initiate the WebRTC connection!
      // This is the ONLY place we initiate connections, preventing WebRTC glare.
      if (statusRef.current === "connected" && data.socketId !== newSocket.id) {
        console.log("Initiating WebRTC connection with newly joined participant:", data.socketId);
        await createPeerConnection(data.socketId, true);
      }
    });

    newSocket.on("participant_left", (data: any) => {
      console.log("Participant left:", data);
      const peer = peersRef.current.get(data.socketId);
      if (peer) {
        peer.peerConnection.close();
        peersRef.current.delete(data.socketId);
      }
      const others = (data.participants || []).filter(
        (p: any) => p.socketId !== newSocket.id
      );
      setParticipants((prev) => {
        return others.map((newP: Participant) => {
          const oldP = prev.find((p) => p.socketId === newP.socketId);
          const peer = peersRef.current.get(newP.socketId);
          return oldP 
            ? { ...oldP, ...newP, videoStream: oldP.videoStream || peer?.videoStream || newP.videoStream } 
            : { ...newP, videoStream: peer?.videoStream || newP.videoStream };
        });
      });
    });

    newSocket.on("offer", async (data: any) => {
      await handleOffer(newSocket, data);
    });

    newSocket.on("answer", async (data: any) => {
      await handleAnswer(data);
    });

    newSocket.on("ice_candidate", async (data: any) => {
      await handleICECandidate(data);
    });

    newSocket.on("receive_caption", (data: any) => {
      handleReceiveCaption(data);
    });

    newSocket.on("receive_room_message", (data: any) => {
      handleReceiveChatMessage(data);
    });

    newSocket.on("participant_hand_raised", (data: any) => {
      handleParticipantHandRaised(data);
    });

    newSocket.on("participant_hand_lowered", (data: any) => {
      handleParticipantHandLowered(data);
    });

    newSocket.on("receive_reaction", (data: any) => {
      handleReceiveReaction(data);
    });

    newSocket.on("waiting_participant", (data: any) => {
      console.log("Waiting participant:", data);
      setWaitingList((prev) => {
        if (prev.some((p) => p.socketId === data.socketId)) return prev;
        return [...prev, data];
      });
    });

    newSocket.on("approval_granted", async (data: any) => {
      console.log("Approval granted for meeting room!");
      setIsWaitingForApproval(false);
      const others = (data.participants || []).filter(
        (p: any) => p.socketId !== newSocket.id
      );
      setParticipants((prev) => {
        return others.map((newP: Participant) => {
          const oldP = prev.find((p) => p.socketId === newP.socketId);
          const peer = peersRef.current.get(newP.socketId);
          return oldP 
            ? { ...oldP, ...newP, videoStream: oldP.videoStream || peer?.videoStream || newP.videoStream } 
            : { ...newP, videoStream: peer?.videoStream || newP.videoStream };
        });
      });
      setStatus("connected");
      await getLocalStream();
    });

    newSocket.on("approval_rejected", (data: any) => {
      console.log("Approval rejected!");
      alert("Your request to join the meeting has been declined by the host.");
      setIsWaitingForApproval(false);
      setStatus("initializing");
      router.push("/");
    });

    newSocket.on("participant_state_changed", (data: any) => {
      console.log("Participant state changed:", data);
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === data.socketId
            ? { ...p, isMuted: data.isMuted, isVideoOff: data.isVideoOff }
            : p
        )
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, roomId]);

  // Transition to waiting lobby after socket is ready
  useEffect(() => {
    if (!socket || !currentUser || status !== "initializing") return;
    setStatus("waiting");
  }, [socket, currentUser]);

  // Get local media stream (safeguarded against concurrent hardware access conflicts)
  async function getLocalStream() {
    if (localStreamRef.current) return localStreamRef.current;
    if (localStreamPromiseRef.current) return localStreamPromiseRef.current;

    const promise = (async () => {
      try {
        // Always request both video and audio hardware tracks so they can be toggled on/off dynamically
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        // Mute/disable tracks based on initial lobby selection
        if (!isVideoOnRef.current) {
          stream.getVideoTracks().forEach((track) => (track.enabled = false));
        }
        if (!isMicOnRef.current) {
          stream.getAudioTracks().forEach((track) => (track.enabled = false));
        }

        localStreamRef.current = stream;
        setMyStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => null);
        }

        // Broadcast initial state so everyone knows our mic/video status
        if (socketRef.current) {
          socketRef.current.emit("update_participant_state", {
            roomId,
            isMuted: !isMicOn,
            isVideoOff: !isVideoOn,
          });
        }

        return stream;
      } catch (err) {
        console.error("Failed to get local stream:", err);
        alert("Failed to access camera/microphone. Please check permissions.");
        return null;
      } finally {
        localStreamPromiseRef.current = null;
      }
    })();

    localStreamPromiseRef.current = promise;
    return promise;
  }

  // Apply virtual background to local camera stream
  const { processedStream } = useVirtualBackground(myStream, activeBackground);

  useEffect(() => {
    processedStreamRef.current = processedStream;
  }, [processedStream]);

  // Replace video track in all peer connections when virtual background processed stream changes
  useEffect(() => {
    if (!processedStream) return;
    const videoTrack = processedStream.getVideoTracks()[0];
    if (!videoTrack) return;

    console.log("Swapping WebRTC video tracks with virtual background track...");

    peersRef.current.forEach(({ peerConnection }) => {
      const sender = peerConnection
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack).catch((err) => {
          console.error("Error replacing track on background change:", err);
        });
      }
    });
  }, [processedStream]);

  const connectToAllPeers = async (currentParticipants: Participant[]) => {
    console.log("Initiating WebRTC connections with all existing peers in room:", currentParticipants);
    for (const p of currentParticipants) {
      if (p.socketId !== socket?.id && !peersRef.current.has(p.socketId)) {
        await createPeerConnection(p.socketId, true);
      }
    }
  };

  // Create peer connection
  async function createPeerConnection(
    peerId: string,
    initiator: boolean,
  ): Promise<RTCPeerConnection | null> {
    try {
      console.log(`[WebRTC] Creating peer connection for peer ${peerId}. Initiator: ${initiator}`);
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      const localStream = await getLocalStream();
      if (localStream) {
        // If we have an active virtual background processed stream, send that video track; otherwise send camera track
        const videoTrack = processedStreamRef.current ? processedStreamRef.current.getVideoTracks()[0] : localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];

        if (audioTrack) {
          peerConnection.addTrack(audioTrack, localStream);
        }
        if (videoTrack) {
          peerConnection.addTrack(videoTrack, localStream);
        }
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice_candidate", {
            from: socketRef.current.id,
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        
        let currentPeer = peersRef.current.get(peerId);
        if (!currentPeer) return;

        const remoteStream = event.streams[0] || new MediaStream();
        if (!event.streams[0]) {
          remoteStream.addTrack(event.track);
        }

        currentPeer.videoStream = remoteStream;

        // Force a new stream reference containing the latest remote tracks
        // to ensure React detects the change and triggers VideoStreamElement to re-bind
        const newStream = new MediaStream(remoteStream.getTracks());

        setParticipants((prev) =>
          prev.map((p) => (p.socketId === peerId ? { ...p, videoStream: newStream } : p))
        );
      };

      peerConnection.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection State with ${peerId}:`, peerConnection.connectionState);
        if (
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "failed"
        ) {
          peersRef.current.delete(peerId);
          handlePeerDisconnect(peerId);
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE Connection State with ${peerId}:`, peerConnection.iceConnectionState);
      };

      // Create or handle data channel for file transfer
      if (initiator) {
        // Initiator creates the data channel
        const dataChannel = peerConnection.createDataChannel("fileTransfer", {
          ordered: true,
        });
        setupDataChannel(dataChannel, peerId);
      } else {
        // Non-initiator listens for data channel
        peerConnection.ondatachannel = (event) => {
          setupDataChannel(event.channel, peerId);
        };
      }

      // Move any globally queued early ICE candidates for this peer to their local candidateQueue
      const earlyQueue = queuedCandidatesRef.current.get(peerId) || [];
      queuedCandidatesRef.current.delete(peerId);

      peersRef.current.set(peerId, {
        peerConnection,
        dataChannel: undefined,
        videoStream: undefined,
        candidateQueue: earlyQueue,
      });

      if (initiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        if (socketRef.current) {
          console.log(`[WebRTC] Sending offer to peer ${peerId}`);
          socketRef.current.emit("offer", {
            from: socketRef.current.id,
            target: peerId,
            offer: offer,
          });
        }
      }

      return peerConnection;
    } catch (err) {
      console.error("Error creating peer connection:", err);
      return null;
    }
  };

  const processQueuedCandidates = async (peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (peer && peer.candidateQueue && peer.candidateQueue.length > 0) {
      console.log(`Processing ${peer.candidateQueue.length} queued ICE candidates for ${peerId}`);
      const pc = peer.peerConnection;
      for (const candidate of peer.candidateQueue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding queued ICE candidate:", err);
        }
      }
      peer.candidateQueue = [];
    }
  };

  const handleOffer = async (socketInstance: Socket, data: any) => {
    try {
      console.log(`[WebRTC] Received offer from ${data.from}`);
      let peer = peersRef.current.get(data.from);
      if (!peer) {
        const pc = await createPeerConnection(data.from, false);
        if (!pc) return;
        peer = peersRef.current.get(data.from)!;
      }

      await peer.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer),
      );
      await processQueuedCandidates(data.from);

      const answer = await peer.peerConnection.createAnswer();
      await peer.peerConnection.setLocalDescription(answer);

      console.log(`[WebRTC] Sending answer to ${data.from}`);
      socketInstance.emit("answer", {
        from: socketInstance.id,
        target: data.from,
        answer: answer,
      });
    } catch (err) {
      console.error("[WebRTC] Error handling offer:", err);
    }
  };

  const handleAnswer = async (data: any) => {
    try {
      console.log(`[WebRTC] Received answer from ${data.from}`);
      const peer = peersRef.current.get(data.from);
      if (peer) {
        await peer.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
        await processQueuedCandidates(data.from);
      }
    } catch (err) {
      console.error("[WebRTC] Error handling answer:", err);
    }
  };

  const handleICECandidate = async (data: any) => {
    try {
      const peer = peersRef.current.get(data.from);
      if (peer) {
        if (data.candidate) {
          const pc = peer.peerConnection;
          if (pc.remoteDescription && pc.remoteDescription.type) {
            console.log(`[WebRTC] Adding ICE candidate from ${data.from}`);
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            if (!peer.candidateQueue) peer.candidateQueue = [];
            peer.candidateQueue.push(data.candidate);
            console.log(`[WebRTC] Queued ICE candidate from ${data.from} (remoteDescription not set yet)`);
          }
        }
      } else {
        // Queue candidate globally if peer is not initialized yet (WebRTC race condition prevention)
        if (data.candidate) {
          console.log(`[WebRTC] Queued early ICE candidate from ${data.from} globally`);
          if (!queuedCandidatesRef.current.has(data.from)) {
            queuedCandidatesRef.current.set(data.from, []);
          }
          queuedCandidatesRef.current.get(data.from)!.push(data.candidate);
        }
      }
    } catch (err) {
      console.error("[WebRTC] Error handling ICE candidate:", err);
    }
  };

  const handlePeerDisconnect = (peerId: string) => {
    setParticipants((prev) => prev.filter((p) => p.socketId !== peerId));
  };

  // Speech Recognition
  const {
    isListening,
    isSupported: isSpeechSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    changeLanguage,
  } = useSpeechRecognition({
    language: selectedLanguage,
    continuous: true,
    interimResults: true,
  });



  // Handle caption translation and broadcasting
  useEffect(() => {
    if (!translationEnabled || !transcript || !socket || !roomId) return;

    const sendCaption = async () => {
      try {
        const targetLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(
          (lang) => lang !== selectedLanguage
        );

        // Get translations for participants' languages
        let translations: Record<string, string> = {};
        try {
          translations = await translateToMultipleLanguages(
            transcript,
            targetLanguages
          );
        } catch (err) {
          console.error("Translation error:", err);
          // Still send caption even if translation fails
        }

        socket.emit("send_caption", {
          roomId,
          captionId: generateFileId(),
          speakerId: socket.id,
          senderName: currentUser?.name || "Unknown",
          originalText: transcript,
          originalLanguage: selectedLanguage.split("-")[0],
          translations,
          timestamp: new Date().toISOString(),
        });

        resetTranscript();
      } catch (err) {
        console.error("Error sending caption:", err);
      }
    };

    // Debounce caption sending
    const debouncedSend = debounceTranslation(
      () => sendCaption(),
      2000
    );

    debouncedSend(transcript);
  }, [transcript, translationEnabled, socket, roomId, currentUser, selectedLanguage]);

  const handleReceiveCaption = (data: any) => {
    const newCaption: Caption = {
      id: data.captionId,
      speakerName: data.senderName,
      originalText: data.originalText,
      originalLanguage: data.originalLanguage,
      translations: data.translations || {},
      timestamp: new Date(data.timestamp),
      isInterim: false,
    };

    setCaptions((prev) => [...prev, newCaption].slice(-20)); // Keep last 20
  };

  const handleReceiveChatMessage = (data: any) => {
    // If we sent this message, ignore it since we already added it locally
    if (socket && data.senderId === socket.id) return;

    setChatMessages((prev) => {
      // Avoid duplicate messages
      if (data.messageId && prev.some((msg) => msg.id === data.messageId)) return prev;

      const newMessage: ChatMessage = {
        id: data.messageId,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        timestamp: new Date(data.timestamp),
        isSystemMessage: data.isSystemMessage,
      };
      return [...prev, newMessage];
    });
  };

  const handleSendChatMessage = (text: string) => {
    if (!socket || !roomId) return;

    const messageId = generateFileId();
    socket.emit("send_room_message", {
      roomId,
      messageId,
      text,
      senderId: socket.id || "",
      senderName: currentUser?.name || "Unknown",
      timestamp: new Date().toISOString(),
    });

    // Add message to local chat immediately
    const localMessage: ChatMessage = {
      id: messageId,
      senderId: socket.id || "",
      senderName: currentUser?.name || "You",
      text,
      timestamp: new Date(),
      isSystemMessage: false,
    };

    setChatMessages((prev) => [...prev, localMessage]);
  };

  const handleRaiseHand = () => {
    if (!socket || !roomId) return;
    socket.emit("raise_hand", {
      roomId,
      userId: currentUser?.id,
      userName: currentUser?.name,
    });
    setIsHandRaised(true);
  };

  const handleLowerHand = () => {
    if (!socket || !roomId) return;
    socket.emit("lower_hand", {
      roomId,
      userId: currentUser?.id,
    });
    setIsHandRaised(false);
  };

  const handleParticipantHandRaised = (data: any) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.socketId === data.socketId
          ? { ...p, hasHandRaised: true, handRaisedAt: new Date(data.timestamp) }
          : p
      )
    );
  };

  const handleParticipantHandLowered = (data: any) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.socketId === data.socketId ? { ...p, hasHandRaised: false } : p
      )
    );
  };

  const handleSendReaction = (emoji: string) => {
    if (!socket || !roomId) return;

    socket.emit("send_reaction", {
      roomId,
      emoji,
      senderName: currentUser?.name || "Unknown",
    });

    // Show reaction locally
    const randomX = Math.random() * (window.innerWidth - 100) + 50;
    const randomY = Math.random() * (window.innerHeight / 2) + 100;
    const reactionId = generateFileId();

    setFloatingReactions((prev) => [
      ...prev,
      { id: reactionId, emoji, x: randomX, y: randomY },
    ]);

    // Remove after animation
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3000);
  };

  const handleReceiveReaction = (data: any) => {
    const randomX = Math.random() * (window.innerWidth - 100) + 50;
    const randomY = Math.random() * (window.innerHeight / 2) + 100;
    const reactionId = generateFileId();

    setFloatingReactions((prev) => [
      ...prev,
      { id: reactionId, emoji: data.emoji, x: randomX, y: randomY },
    ]);

    // Remove after animation
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3000);
  };

  // Data channel setup for file transfers
  const setupDataChannel = (
    dataChannel: RTCDataChannel,
    peerId: string
  ) => {
    if (!dataChannel) {
      console.warn("[WebRTC] dataChannel is null or undefined inside setupDataChannel");
      return;
    }

    try {
      dataChannel.binaryType = "arraybuffer";

      dataChannel.onopen = () => {
        try {
          console.log("Data channel opened with", peerId);
          const peer = peersRef.current.get(peerId);
          if (peer) {
            peer.dataChannel = dataChannel;
          }
        } catch (e) {
          console.error("Error inside dataChannel.onopen:", e);
        }
      };

      dataChannel.onmessage = (event) => {
        try {
          handleDataChannelMessage(event.data, peerId);
        } catch (e) {
          console.error("Error inside dataChannel.onmessage:", e);
        }
      };

      dataChannel.onerror = (error) => {
        try {
          console.error("Data channel error with peer:", peerId, error);
        } catch (e) {
          console.error("Error inside dataChannel.onerror:", e);
        }
      };

      dataChannel.onclose = () => {
        try {
          console.log("Data channel closed with", peerId);
          const peer = peersRef.current.get(peerId);
          if (peer) {
            peer.dataChannel = undefined;
          }
        } catch (e) {
          console.error("Error inside dataChannel.onclose:", e);
        }
      };
    } catch (err) {
      console.error("Error during data channel setup:", err);
    }
  };

  const handleDataChannelMessage = (data: ArrayBuffer, peerId: string) => {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));

      if (message.type === "file_offer") {
        handleFileOffer(message as FileOffer, peerId);
      } else if (message.type === "file_chunk") {
        handleFileChunk(message as any, peerId);
      } else if (message.type === "file_complete") {
        handleFileComplete(message as FileComplete, peerId);
      } else if (message.type === "file_ready") {
        handleFileReady(message as FileReady);
      } else if (message.type === "file_received") {
        handleFileReceived(message as FileReceived);
      }
    } catch (err) {
      console.error("Error handling data channel message:", err);
    }
  };

  const handleFileOffer = (offer: FileOffer, peerId: string) => {
    // Get sender name from participants
    const sender = participants.find((p) => p.socketId === peerId);
    const senderName = sender?.userName || "Unknown";

    const fileTransfer: FileTransferState = {
      fileId: offer.fileId,
      fileName: offer.fileName,
      fileSize: offer.fileSize,
      fileHash: offer.fileHash,
      mimeType: offer.mimeType,
      progress: 0,
      chunks: new Map(),
      status: "pending",
      senderName,
      targetPeerId: peerId,
    };

    fileTransfersRef.current.set(offer.fileId, fileTransfer);
    setIncomingFiles((prev) => new Map(prev).set(offer.fileId, fileTransfer));
    setSharedFiles((prev) => {
      if (prev.some((f) => f.fileId === offer.fileId)) return prev;
      return [...prev, fileTransfer];
    });
  };

  const handleFileChunk = (
    message: any,
    peerId: string
  ) => {
    const { fileId, chunkIndex, totalChunks, data } = message;
    const fileTransfer = fileTransfersRef.current.get(fileId);

    if (!fileTransfer) return;

    // Store chunk
    fileTransfer.chunks.set(chunkIndex, base64ToArrayBuffer(data));
    fileTransfer.progress = (fileTransfer.chunks.size / totalChunks) * 100;

    setIncomingFiles((prev) => new Map(prev).set(fileId, { ...fileTransfer }));
    setSharedFiles((prev) =>
      prev.map((f) =>
        f.fileId === fileId ? { ...f, progress: fileTransfer.progress } : f
      )
    );
  };

  const handleFileComplete = async (complete: FileComplete, peerId: string) => {
    const fileTransfer = fileTransfersRef.current.get(complete.fileId);
    if (!fileTransfer) return;

    try {
      // Verify hash
      const chunks = Array.from(fileTransfer.chunks.values());
      const fullBuffer = new ArrayBuffer(
        chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
      );
      const view = new Uint8Array(fullBuffer);
      let offset = 0;

      for (const chunk of chunks) {
        view.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      const calculatedHash = await calculateSHA256(fullBuffer);
      if (calculatedHash !== complete.fileHash) {
        throw new Error("File hash mismatch - file corrupted");
      }

      fileTransfer.status = "complete";
      fileTransfer.progress = 100;
      fileTransfersRef.current.set(complete.fileId, fileTransfer);
      setIncomingFiles(
        (prev) => new Map(prev).set(complete.fileId, { ...fileTransfer })
      );
      setSharedFiles((prev) =>
        prev.map((f) =>
          f.fileId === complete.fileId
            ? { ...f, status: "complete", progress: 100 }
            : f
        )
      );

      // Send file received confirmation
      const peer = peersRef.current.get(peerId);
      if (peer?.dataChannel) {
        const message: FileReceived = {
          type: "file_received",
          fileId: complete.fileId,
        };
        peer.dataChannel.send(
          new TextEncoder().encode(JSON.stringify(message))
        );
      }
    } catch (err) {
      fileTransfer.status = "error";
      fileTransfer.error =
        err instanceof Error ? err.message : "Verification failed";
      fileTransfersRef.current.set(complete.fileId, fileTransfer);
      setIncomingFiles(
        (prev) => new Map(prev).set(complete.fileId, { ...fileTransfer })
      );
      setSharedFiles((prev) =>
        prev.map((f) =>
          f.fileId === complete.fileId
            ? {
                ...f,
                status: "error",
                error: err instanceof Error ? err.message : "Verification failed",
              }
            : f
        )
      );
    }
  };

  const handleFileReady = (ready: FileReady) => {
    const fileTransfer = fileTransfersRef.current.get(ready.fileId);
    if (fileTransfer) {
      fileTransfer.status = "downloading";
      fileTransfersRef.current.set(ready.fileId, fileTransfer);
      if (outgoingFile && outgoingFile.fileId === ready.fileId) {
        setOutgoingFile({ ...fileTransfer });
      }
      setSharedFiles((prev) =>
        prev.map((f) =>
          f.fileId === ready.fileId ? { ...f, status: "downloading" } : f
        )
      );
    }
  };

  const handleFileReceived = (received: FileReceived) => {
    const fileTransfer = fileTransfersRef.current.get(received.fileId);
    if (fileTransfer) {
      fileTransfer.status = "complete";
      fileTransfer.progress = 100;
      fileTransfersRef.current.set(received.fileId, fileTransfer);
      if (outgoingFile && outgoingFile.fileId === received.fileId) {
        setOutgoingFile({ ...fileTransfer });
      }
      setSharedFiles((prev) =>
        prev.map((f) =>
          f.fileId === received.fileId
            ? { ...f, status: "complete", progress: 100 }
            : f
        )
      );
    }
  };

  const sendFileToParticipant = async (
    file: File,
    targetPeerId: string,
    onProgress: (progress: number) => void
  ) => {
    const peer = peersRef.current.get(targetPeerId);
    if (!peer?.dataChannel || peer.dataChannel.readyState !== "open") {
      throw new Error("Data channel not ready");
    }

    const fileId = generateFileId();
    const buffer = await fileToArrayBuffer(file);
    const fileHash = await calculateSHA256(buffer);

    // Send file offer
    const offer: FileOffer = {
      type: "file_offer",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileHash,
      mimeType: file.type,
    };

    peer.dataChannel.send(new TextEncoder().encode(JSON.stringify(offer)));

    // Populate chunks map so the sender can download the file too
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const chunksMap = new Map<number, ArrayBuffer>();
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunksMap.set(i, buffer.slice(start, end));
    }

    const fileTransfer: FileTransferState = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileHash,
      mimeType: file.type,
      progress: 0,
      chunks: chunksMap,
      status: "downloading",
      senderName: "You",
      targetPeerId,
    };

    setOutgoingFile(fileTransfer);
    fileTransfersRef.current.set(fileId, fileTransfer);
    setSharedFiles((prev) => [...prev, fileTransfer]);

    // Wait for recipient to be ready
    await new Promise((resolve) => {
      const checkReady = () => {
        const ft = fileTransfersRef.current.get(fileId);
        if (ft?.status === "downloading") {
          resolve(null);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });

    // Send file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = buffer.slice(start, end);

      const message: FileChunk = {
        type: "file_chunk",
        fileId,
        chunkIndex: i,
        totalChunks,
        data: arrayBufferToBase64(chunk),
      };

      peer.dataChannel.send(
        new TextEncoder().encode(JSON.stringify(message))
      );

      fileTransfer.progress = ((i + 1) / totalChunks) * 100;
      onProgress(fileTransfer.progress);
      setOutgoingFile({ ...fileTransfer });
      setSharedFiles((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, progress: fileTransfer.progress } : f
        )
      );
    }

    // Send completion
    const complete: FileComplete = {
      type: "file_complete",
      fileId,
      fileName: file.name,
      fileHash,
    };

    peer.dataChannel.send(new TextEncoder().encode(JSON.stringify(complete)));
  };

  const acceptFileTransfer = (fileId: string) => {
    const fileTransfer = fileTransfersRef.current.get(fileId);
    if (!fileTransfer || !fileTransfer.targetPeerId) return;

    const peer = peersRef.current.get(fileTransfer.targetPeerId);
    if (peer?.dataChannel) {
      fileTransfer.status = "downloading";
      fileTransfersRef.current.set(fileId, fileTransfer);
      setIncomingFiles((prev) => new Map(prev).set(fileId, { ...fileTransfer }));
      setSharedFiles((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: "downloading" } : f
        )
      );

      const message: FileReady = {
        type: "file_ready",
        fileId,
      };

      peer.dataChannel.send(
        new TextEncoder().encode(JSON.stringify(message))
      );
    }
  };

  const rejectFileTransfer = (fileId: string) => {
    const fileTransfer = fileTransfersRef.current.get(fileId);
    if (fileTransfer) {
      fileTransfer.status = "error";
      fileTransfer.error = "Rejected by user";
      fileTransfersRef.current.set(fileId, fileTransfer);
    }
    setIncomingFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
    setSharedFiles((prev) =>
      prev.map((f) =>
        f.fileId === fileId
          ? { ...f, status: "error", error: "Rejected by user" }
          : f
      )
    );
  };

  const downloadFile = (fileId: string) => {
    const fileTransfer = fileTransfersRef.current.get(fileId);
    if (!fileTransfer || fileTransfer.status !== "complete") return;

    const chunks = Array.from(fileTransfer.chunks.values());
    const fullBuffer = new ArrayBuffer(
      chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    );
    const view = new Uint8Array(fullBuffer);
    let offset = 0;

    for (const chunk of chunks) {
      view.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    const blob = new Blob([fullBuffer], { type: fileTransfer.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileTransfer.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Media controls
  const handleToggleMic = () => {
    const nextMicOn = !isMicOn;
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = nextMicOn));
    }
    setIsMicOn(nextMicOn);

    if (socket) {
      socket.emit("update_participant_state", {
        roomId,
        isMuted: !nextMicOn,
        isVideoOff: !isVideoOn,
      });
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOn = !isVideoOn;
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = nextVideoOn));
    }
    setIsVideoOn(nextVideoOn);

    if (socket) {
      socket.emit("update_participant_state", {
        roomId,
        isMuted: !isMicOn,
        isVideoOff: !nextVideoOn,
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        const videoTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peersRef.current.forEach(({ peerConnection }) => {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack).catch(console.error);
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }

        videoTrack.onended = handleStopScreenShare;
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      handleStopScreenShare();
    }
  };

  const handleStopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      peersRef.current.forEach(({ peerConnection }) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack).catch(console.error);
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  const handleLeaveCall = () => {
    if (socket) {
      socket.emit("leave_room", { roomId });
    }

    // Stop all streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peersRef.current.forEach(({ peerConnection }) => {
      peerConnection.close();
    });
    peersRef.current.clear();

    if (currentUser && !currentUser.isGuest) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  // Render appropriate view
  if (isWaitingForApproval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.08),_transparent_40%)] pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-cyan-500 border-b border-l border-slate-200 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-850">Asking to join...</h2>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              You will join the meeting as soon as the host admits you. Please wait a moment.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setIsWaitingForApproval(false);
                if (socket) {
                  socket.emit("leave_room", { roomId });
                }
              }}
              className="px-6 py-2.5 rounded-xl border border-slate-250 hover:bg-slate-100 transition text-sm font-semibold text-slate-600 hover:text-slate-800 shadow-sm cursor-pointer"
            >
              Cancel request
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "waiting" && !myStream) {
    return (
      <WaitingRoom
        roomId={roomId}
        userName={currentUser?.name || "Guest"}
        onJoinSuccess={async () => {
          if (!socket || !currentUser) return;
          const isGuest = !!currentUser.isGuest;

          socket.emit("join_room", {
            roomId,
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            requiresApproval: isGuest,
          });

          if (isGuest) {
            setIsWaitingForApproval(true);
          } else {
            setStatus("connected");
            await getLocalStream();
          }
        }}
        videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        activeBackground={activeBackground}
        onChangeBackground={setActiveBackground}
        isGuest={!!currentUser?.isGuest}
        onNameChange={(name) => {
          setCurrentUser((prev: any) => ({ ...prev, name }));
        }}
        isVideoOn={isVideoOn}
        isMicOn={isMicOn}
        onToggleVideo={handleToggleVideo}
        onToggleMic={handleToggleMic}
      />
    );
  }

  if (status === "connected") {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Main call interface */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <VideoCallInterface
            roomId={roomId}
            participants={participants}
            myStream={processedStream || myStream}
            isVideoOn={isVideoOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            onToggleMic={handleToggleMic}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onLeaveCall={handleLeaveCall}
            onToggleChat={() => {
              setActiveSidebar(activeSidebar === "chat" ? "none" : "chat");
            }}
            onToggleParticipants={() => {
              setActiveSidebar(activeSidebar === "participants" ? "none" : "participants");
            }}
            onToggleBackgroundPicker={() => {
              setActiveSidebar(activeSidebar === "backgrounds" ? "none" : "backgrounds");
            }}
            onToggleFiles={() => {
              setActiveSidebar(activeSidebar === "files" ? "none" : "files");
            }}
            onFileSelected={sendFileToParticipant}
            incomingFiles={incomingFiles}
            onAcceptFile={acceptFileTransfer}
            onRejectFile={rejectFileTransfer}
            onDownloadFile={downloadFile}
            isHandRaised={isHandRaised}
            onRaiseHand={handleRaiseHand}
            onLowerHand={handleLowerHand}
            onSendReaction={handleSendReaction}
            isGuest={!!currentUser?.isGuest}
          />

          {/* Caption Display (Premium Logged In Users Only) */}
          {!currentUser?.isGuest && (
            <CaptionDisplay
              captions={captions}
              currentUserLanguage={selectedLanguage.split("-")[0]}
              isListening={isListening}
              onClearCaptions={() => setCaptions([])}
            />
          )}

          {/* Translation Controls (Premium Logged In Users Only) */}
          {!currentUser?.isGuest && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
              <TranslationControls
                isListening={isListening}
                selectedLanguage={selectedLanguage}
                isSupported={isSpeechSupported}
                onStartListening={startListening}
                onStopListening={stopListening}
                onLanguageChange={(lang) => {
                  setSelectedLanguage(lang);
                  changeLanguage(lang);
                }}
                disabled={!translationEnabled}
              />
            </div>
          )}

          {/* Floating Reactions Display */}
          <ReactionDisplay reactions={floatingReactions} />

          {/* Floating Quick Approval Toast */}
          {waitingList.length > 0 && (
            <div className="fixed top-20 right-6 z-50 w-80 animate-slideIn">
              <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Lobby Request
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {waitingList.length} waiting
                  </span>
                </div>
                
                {(() => {
                  const nextUser = waitingList[0];
                  return (
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {nextUser.userName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          wants to join this meeting
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (socket) {
                              socket.emit("approve_participant", { roomId, socketId: nextUser.socketId });
                              setWaitingList((prev) => prev.filter((item) => item.socketId !== nextUser.socketId));
                            }
                          }}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs transition duration-200 shadow-lg shadow-cyan-500/15 text-center cursor-pointer"
                        >
                          Admit
                        </button>
                        <button
                          onClick={() => {
                            if (socket) {
                              socket.emit("reject_participant", { roomId, socketId: nextUser.socketId });
                              setWaitingList((prev) => prev.filter((item) => item.socketId !== nextUser.socketId));
                            }
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-lg text-xs transition border border-white/5 text-center cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Container */}
        {activeSidebar !== "none" && (
          <div className="w-full sm:w-80 h-screen flex-shrink-0 z-30 fixed sm:relative right-0 top-0 pt-12 sm:pt-0 shadow-2xl">
            {activeSidebar === "chat" && (
              <MeetingChat
                messages={chatMessages}
                currentUserId={socket?.id || ""}
                currentUserName={currentUser?.name || "You"}
                onSendMessage={handleSendChatMessage}
                onClose={() => setActiveSidebar("none")}
              />
            )}

            {activeSidebar === "backgrounds" && (
              <BackgroundPicker
                activeBackground={activeBackground}
                onChangeBackground={(bg) => {
                  setActiveBackground(bg);
                }}
                onClose={() => setActiveSidebar("none")}
              />
            )}

            {activeSidebar === "participants" && (
              <div className="w-full h-full bg-white/95 border-l border-slate-200/80 flex flex-col shadow-2xl p-4 text-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Participants</h3>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{participants.length + 1} connected</p>
                  </div>
                  <button
                    onClick={() => setActiveSidebar("none")}
                    className="rounded-full p-1.5 hover:bg-slate-100 transition text-slate-400 hover:text-slate-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Hand Raise Quick Manager */}
                <div className="mb-4">
                  <HandRaiseManager
                    participants={[
                      {
                        socketId: "self",
                        userName: "You",
                        hasHandRaised: isHandRaised,
                      },
                      ...participants.map(p => ({
                        socketId: p.socketId,
                        userName: p.userName,
                        hasHandRaised: !!p.hasHandRaised,
                        handRaisedAt: p.handRaisedAt,
                      }))
                    ]}
                    currentSocketId="self"
                    onRaiseHand={handleRaiseHand}
                    onLowerHand={handleLowerHand}
                    isHandRaised={isHandRaised}
                  />
                </div>

                {/* Lobby / Guest Approvals */}
                {waitingList.length > 0 && (
                  <div className="mb-6 bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 space-y-2.5">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider px-1">Lobby Waiting Room ({waitingList.length})</p>
                    <div className="space-y-2">
                      {waitingList.map((p) => (
                        <div key={p.socketId} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <span className="text-xs font-semibold text-slate-800 truncate">{p.userName}</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                if (socket) {
                                  socket.emit("approve_participant", { roomId, socketId: p.socketId });
                                  setWaitingList((prev) => prev.filter((item) => item.socketId !== p.socketId));
                                }
                              }}
                              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded text-[10px] transition text-center cursor-pointer shadow-sm"
                            >
                              Admit
                            </button>
                            <button
                              onClick={() => {
                                if (socket) {
                                  socket.emit("reject_participant", { roomId, socketId: p.socketId });
                                  setWaitingList((prev) => prev.filter((item) => item.socketId !== p.socketId));
                                }
                              }}
                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-1 px-2 rounded text-[10px] transition border border-rose-250/30 text-center cursor-pointer shadow-sm"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Participants list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Meeting Roster</p>
                  
                  {/* Local User */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-600 flex items-center justify-center font-bold text-xs uppercase border border-cyan-500/20 shadow-sm">
                        {(currentUser?.name || "Y").charAt(0)}
                      </div>
                      <span className="text-sm font-semibold truncate text-slate-700">{currentUser?.name || "You"} (You)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      {isMicOn ? <span>🎙️</span> : <span>🔇</span>}
                      {isVideoOn ? <span>📹</span> : <span>📷</span>}
                    </div>
                  </div>

                  {/* Remote Users */}
                  {participants.map((p) => (
                    <div key={p.socketId} className="flex items-center justify-between p-2 rounded-lg bg-slate-100/30 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase border border-slate-200 shadow-sm">
                          {p.userName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium truncate text-slate-700">{p.userName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        {p.hasHandRaised && <span className="animate-pulse">✋</span>}
                        {p.isMuted ? <span>🔇</span> : <span>🎙️</span>}
                        {p.isVideoOff ? <span>📷</span> : <span>📹</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}                {activeSidebar === "files" && (
              <div className="w-full h-full bg-white/95 border-l border-slate-200/80 flex flex-col shadow-2xl p-4 text-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-3 flex-shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-850">Shared Files</h3>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{sharedFiles.length} file{sharedFiles.length !== 1 ? 's' : ''} shared</p>
                  </div>
                  <button
                    onClick={() => setActiveSidebar("none")}
                    className="rounded-full p-1.5 hover:bg-slate-100 transition text-slate-400 hover:text-slate-800 animate-fadeIn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Filters & Search - Premium Shared Files List */}
                <div className="mb-4 space-y-2.5 flex-shrink-0">
                  {/* Tabs */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
                    <button
                      onClick={() => setFileTab("all")}
                      className={`flex-1 py-1 rounded-md transition font-semibold ${fileTab === "all" ? "bg-white text-cyan-600 shadow-sm border border-slate-200/40" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFileTab("received")}
                      className={`flex-1 py-1 rounded-md transition font-semibold ${fileTab === "received" ? "bg-white text-cyan-600 shadow-sm border border-slate-200/40" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Received
                    </button>
                    <button
                      onClick={() => setFileTab("sent")}
                      className={`flex-1 py-1 rounded-md transition font-semibold ${fileTab === "sent" ? "bg-white text-cyan-600 shadow-sm border border-slate-200/40" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Sent
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                    </svg>
                    {fileSearchQuery && (
                      <button
                        onClick={() => setFileSearchQuery("")}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Shared Files list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(() => {
                    const filtered = sharedFiles.filter((file) => {
                      const isOutgoing = file.senderName === undefined || file.senderName === "You" || !file.senderName;
                      const matchesTab = 
                        fileTab === "all" || 
                        (fileTab === "received" && !isOutgoing) || 
                        (fileTab === "sent" && isOutgoing);
                        
                      const matchesSearch = file.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase());
                      
                      return matchesTab && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-slate-450 text-center px-4 py-8">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                          </svg>
                          <p className="text-xs font-semibold text-slate-600">No matching files found</p>
                          <p className="text-[10px] text-slate-400 mt-1">Try another filter or query</p>
                        </div>
                      );
                    }

                    return [...filtered].reverse().map((file) => {
                      const isOutgoing = file.senderName === undefined || file.senderName === "You" || !file.senderName;
                      return (
                        <div key={file.fileId} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200/80 backdrop-blur-md shadow-sm transition hover:bg-slate-100/50">
                          {/* File info */}
                          <div className="flex items-start gap-2.5 min-w-0">
                            {getFileIcon(file.fileName, file.mimeType)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate" title={file.fileName}>
                                {file.fileName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500">
                                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="text-[10px] text-slate-300">•</span>
                                <span className="text-[10px] font-semibold text-cyan-600">
                                  {isOutgoing ? "Sent by you" : `From ${file.senderName}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress / Status / Actions */}
                          {file.status === "pending" && (
                            <div className="flex gap-1.5 mt-1">
                              <button
                                onClick={() => acceptFileTransfer(file.fileId)}
                                className="flex-1 py-1.5 px-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-md text-xs transition duration-250 cursor-pointer shadow-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => rejectFileTransfer(file.fileId)}
                                className="flex-1 py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md text-xs border border-slate-200/40 transition duration-250 cursor-pointer shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {file.status === "downloading" && (
                            <div className="mt-1">
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-cyan-500 h-full transition-all duration-200"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-slate-400">Transferring...</span>
                                <span className="text-[10px] font-semibold text-cyan-500">{Math.round(file.progress)}%</span>
                              </div>
                            </div>
                          )}

                          {file.status === "complete" && (
                            <div className="mt-1 flex flex-col gap-1.5">
                              <button
                                onClick={() => downloadFile(file.fileId)}
                                className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-md text-xs transition duration-250 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                title="Download shared file (no limit)"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Download File
                              </button>
                              
                              {isOutgoing && (
                                <div className="text-center py-0.5 text-[9px] text-emerald-600 font-semibold bg-emerald-50/50 rounded border border-emerald-250/20">
                                  ✓ Sent Successfully
                                </div>
                              )}
                            </div>
                          )}

                          {file.status === "error" && (
                            <div className="mt-1 text-[10px] text-red-600 bg-red-50 border border-red-200/50 p-2 rounded shadow-sm font-semibold">
                              {file.error || "Transfer failed"}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white">Initializing meeting...</p>
      </div>
    </div>
  );
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
}

function getFileIcon(fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(extension || "") || mimeType.startsWith("image/")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375 3.75 0 1 1-.75 0 .375 3.75 0 0 1 .75 0Z" />
        </svg>
      </div>
    );
  }
  
  if (["mp4", "webm", "avi", "mov", "mkv", "flv"].includes(extension || "") || mimeType.startsWith("video/")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9a2.25 2.25 0 0 0-2.25 2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
    );
  }

  if (["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(extension || "") || mimeType.startsWith("audio/")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 0v11.25m0-11.25L9 12M9 12v6.25m0 0l-3-1.875M9 12l-3-1.875M9 18.75c0 .69-.56 1.25-1.25 1.25H5.25C4.56 20 4 19.44 4 18.75V16.25c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v2.5Zm10.5-5c0 .69-.56 1.25-1.25 1.25h-2.5c-.69 0-1.25-.56-1.25-1.25v-2.5c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v2.5Z" />
        </svg>
      </div>
    );
  }

  if (["pdf"].includes(extension || "")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
    );
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(extension || "")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247 2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </div>
    );
  }

  if (["js", "ts", "tsx", "jsx", "html", "css", "py", "java", "cpp", "c", "sh", "json"].includes(extension || "")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center flex-shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    </div>
  );
}
