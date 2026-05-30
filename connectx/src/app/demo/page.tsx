"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthUser, getCurrentUser, logoutUser } from "@/lib/auth";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Languages,
  Loader2,
  Send,
  Paperclip,
  Copy,
  Check,
  Maximize2,
} from "lucide-react";

export default function DemoCallPage() {
  const router = useRouter();
  // WebRTC / PeerJS State
  const [peerId, setPeerId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [peer, setPeer] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Media State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  // UI Toggles
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [roomCode, setRoomCode] = useState("");

  // Data State
  const [messages, setMessages] = useState<
    Array<{
      text: string;
      sender: string;
      time: string;
      isFile?: boolean;
      fileName?: string;
      fileUrl?: string;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transferNotice, setTransferNotice] = useState("");
  const [caption, setCaption] = useState("");

  // Refs
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [dataConn, setDataConn] = useState<any>(null);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setCurrentUser(storedUser);

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room")?.trim();
    if (roomParam) {
      setRoomCode(roomParam);
      setTargetId(roomParam);
    }

    // Dynamically import PeerJS so it only runs on the client
    import("peerjs").then(({ default: Peer }) => {
      // Initialize PeerJS connection
      const newPeer = new Peer({
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });

      newPeer.on("open", (id) => {
        setPeerId(id);
      });

      // Handle incoming data connection (Chat & Captions)
      newPeer.on("connection", (conn) => {
        setDataConn(conn);
        setupDataConn(conn);
      });

      // Handle incoming video calls
      newPeer.on("call", async (call) => {
        setConnectionStatus("Incoming Call...");

        attachCallHandlers(call);

        try {
          const stream =
            myStream ||
            (await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            }));

          if (!myStream) {
            setMyStream(stream);
            if (myVideoRef.current) myVideoRef.current.srcObject = stream;
          }

          call.answer(stream);
          setCurrentCall(call);
        } catch (err) {
          console.error("Failed to get local stream", err);
          alert(
            "Could not answer call. Please allow camera/microphone permissions.",
          );
        }
      });

      setPeer(newPeer);
    });

    return () => {
      if (myStream) myStream.getTracks().forEach((track) => track.stop());
      if (screenStream)
        screenStream.getTracks().forEach((track) => track.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      if (peer) peer.destroy();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  const setupDataConn = (conn: any) => {
    conn.on("open", () => console.log("Data connection opened"));
    conn.on("data", (data: any) => {
      if (data.type === "chat") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "caption") {
        setCaption(data.text);
        setTimeout(() => setCaption(""), 4000);
      } else if (data.type === "file") {
        const fileUrl = data.fileData;
        setMessages((prev) => [
          ...prev,
          {
            text: `Received file: ${data.fileName}`,
            sender: "Peer",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isFile: true,
            fileName: data.fileName,
            fileUrl,
          },
        ]);
        setTransferNotice(`Received ${data.fileName}`);
        setTimeout(() => setTransferNotice(""), 3000);
      }
    });
    conn.on("close", () => console.log("Data connection closed"));
  };

  const attachRemoteStream = (remoteStream: MediaStream) => {
    setIsConnected(true);
    setRemoteConnected(true);
    setIsCalling(false);
    setConnectionStatus("Connected");

    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    videoEl.srcObject = remoteStream;
    videoEl.muted = true;

    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          videoEl.muted = false;
        })
        .catch((e) => console.log("Remote video play error:", e));
    }
  };

  const attachCallHandlers = (call: any) => {
    call.on("stream", attachRemoteStream);
    call.on("close", endCallCleanup);
    call.on("error", (err: any) => {
      console.error("Call error:", err);
      setIsCalling(false);
      setConnectionStatus("Failed to connect");
    });
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
    } catch (err) {
      alert(
        "Failed to access camera/microphone. Please check browser permissions.",
      );
    }
  };

  const callPeer = async () => {
    if (!targetId || !peer) return;
    setIsCalling(true);
    setConnectionStatus("Connecting...");

    try {
      let stream = myStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      }

      // Create Data Connection
      const conn = peer.connect(targetId);
      setDataConn(conn);
      setupDataConn(conn);

      // Create Video Connection
      const call = peer.call(targetId, stream);
      attachCallHandlers(call);
      setCurrentCall(call);
    } catch (err) {
      console.error(err);
      setIsCalling(false);
      setConnectionStatus("Error during call");
      alert("Could not initialize camera for the call.");
    }
  };

  const endCallCleanup = () => {
    setIsConnected(false);
    setRemoteConnected(false);
    setElapsedSeconds(0);
    setCurrentCall(null);
    setDataConn(null);
    setIsScreenSharing(false);
    setIsTranslating(false);
    setConnectionStatus("Disconnected");
    if (recognitionRef.current) recognitionRef.current.stop();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const endCall = () => {
    if (currentCall) currentCall.close();
    if (dataConn) dataConn.close();
    endCallCleanup();
  };

  const copyToClipboard = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleNewMeeting = () => {
    if (!peerId) return;
    navigator.clipboard.writeText(peerId);
    alert(
      "New meeting created. Your meeting code has been copied. Share it with a friend to join.",
    );
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isConnected) {
      timer = setInterval(() => {
        setElapsedSeconds((current) => current + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Toggles
  const toggleMic = () => {
    if (myStream) {
      const track = myStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      const track = myStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOn(track.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);

        const videoTrack = stream.getVideoTracks()[0];

        if (currentCall) {
          const sender = currentCall.peerConnection
            .getSenders()
            .find((s: any) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        }

        if (myVideoRef.current) myVideoRef.current.srcObject = stream;

        videoTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStream) screenStream.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setIsScreenSharing(false);

    if (myStream && currentCall) {
      const videoTrack = myStream.getVideoTracks()[0];
      const sender = currentCall.peerConnection
        .getSenders()
        .find((s: any) => s.track?.kind === "video");
      if (sender && videoTrack) sender.replaceTrack(videoTrack);
      if (myVideoRef.current) myVideoRef.current.srcObject = myStream;
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && dataConn) {
      const msgData = {
        text: chatInput,
        sender: "Peer",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      dataConn.send({ type: "chat", message: msgData });
      setMessages((prev) => [...prev, { ...msgData, sender: "You" }]);
      setChatInput("");
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const sendFile = () => {
    if (!selectedFile || !dataConn) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result as string;
      const payload = {
        type: "file",
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData,
      };
      dataConn.send(payload);
      setMessages((prev) => [
        ...prev,
        {
          text: `Sent file: ${selectedFile.name}`,
          sender: "You",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isFile: true,
          fileName: selectedFile.name,
          fileUrl: fileData,
        },
      ]);
      setSelectedFile(null);
      setTransferNotice(`Sent ${selectedFile.name}`);
      setTimeout(() => setTransferNotice(""), 3000);
    };
    reader.readAsDataURL(selectedFile);
  };

  const toggleTranslation = () => {
    if (isTranslating) {
      recognitionRef.current?.stop();
      setIsTranslating(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setCaption(transcript);
          if (dataConn) dataConn.send({ type: "caption", text: transcript });
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranslating(true);
      } else {
        alert(
          "Live transcription is not supported in this browser. Please use Google Chrome.",
        );
      }
    }
  };

  const makeFullscreen = (ref: React.RefObject<HTMLVideoElement | null>) => {
    if (ref.current) {
      if (ref.current.requestFullscreen) {
        ref.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 text-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-indigo-200 flex items-center justify-between px-4 md:px-6 shrink-0 glass relative z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-indigo-100 rounded-full transition-colors bg-white/60 backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </Link>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Secure Video Call
            </p>
            <p className="text-xs text-slate-500">
              {roomCode
                ? `Room: ${roomCode}`
                : "Create or paste a code to connect"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700">
              <span>{currentUser.name}</span>
              <span className="bg-cyan-100 text-cyan-700 rounded-full px-2 py-0.5">
                Live
              </span>
            </div>
          ) : null}
          {peerId ? (
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 transition-colors text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-indigo-300"
            >
              <span className="hidden sm:inline">Your ID: </span>
              <span className="font-mono">{peerId.slice(0, 8)}</span>
              {isCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Generating ID...
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative w-full h-[calc(100dvh-4rem)]">
        {/* Call Layout Area */}
        <div
          className={`flex-1 flex flex-col p-2 md:p-4 transition-all duration-300 relative h-full w-full bg-slate-900`}
        >
          {/* Connection Setup Area */}
          {!isConnected && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white/95 backdrop-blur-xl border border-indigo-200 rounded-2xl p-6 z-30 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-slate-900">
                Join a Video Call
              </h3>
              {!myStream ? (
                <button
                  onClick={initializeMedia}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-medium transition-all mb-4 shadow-lg"
                >
                  Allow Camera & Mic
                </button>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleNewMeeting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-medium transition-all shadow-lg"
                    >
                      New Meeting
                    </button>
                  </div>
                  <div className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                    Ready to call
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-600 font-medium">
                      Enter meeting code or ID:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 9b1deb4d-3b7d-4bad..."
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-mono text-slate-900"
                      />
                      <button
                        onClick={callPeer}
                        disabled={isCalling || !targetId.trim()}
                        className="px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:opacity-50 text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        {isCalling ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Phone className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-center mt-2 text-indigo-700 bg-indigo-100 py-2 rounded-lg border border-indigo-200 font-medium">
                    Status: {connectionStatus} •{" "}
                    {remoteConnected
                      ? `Live • ${formatElapsedTime(elapsedSeconds)}`
                      : "Waiting for peer"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Videos Grid */}
          <div
            className={`flex-1 w-full grid gap-3 md:gap-4 ${isConnected ? "grid-rows-2 md:grid-rows-1 md:grid-cols-2" : "grid-cols-1 max-w-4xl mx-auto"} relative z-0 h-full`}
          >
            {/* Main Speaker (Remote) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 group shadow-2xl flex items-center justify-center w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {(!isConnected || !remoteConnected) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center bg-slate-900/90">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/80 text-white text-xl">
                    ?
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    Waiting for remote participant
                  </span>
                  <span className="text-xs text-slate-400 max-w-xs">
                    Share the meeting code and invite others. Their video
                    appears here once connected.
                  </span>
                </div>
              )}
              {isConnected && (
                <button
                  onClick={() => makeFullscreen(remoteVideoRef)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              {isConnected && (
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium border border-white/20 flex items-center gap-2 text-white">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  Remote User
                </div>
              )}
            </div>

            {/* User Video (Local) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center w-full h-full group">
              <video
                ref={myVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoOn && !isScreenSharing ? "opacity-0" : "opacity-100"}`}
              />

              {!isVideoOn && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-xl md:text-3xl font-bold text-white">
                    YOU
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium border border-white/20 flex flex-col text-white">
                <span>
                  You{" "}
                  {(!isVideoOn || !isMicOn) &&
                    `(${!isVideoOn ? "Camera Off" : ""} ${!isVideoOn && !isMicOn ? "&" : ""} ${!isMicOn ? "Muted" : ""})`}
                </span>
                {isScreenSharing && (
                  <span className="text-xs text-blue-400 font-bold">
                    Sharing Screen
                  </span>
                )}
                {isTranslating && (
                  <span className="text-xs text-emerald-400 font-bold">
                    Transcribing...
                  </span>
                )}
              </div>

              <button
                onClick={() => makeFullscreen(myVideoRef)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-lg backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Captions Overlay */}
          {caption && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl text-center z-10 pointer-events-none transition-opacity">
              <div className="inline-block bg-black/80 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl text-lg md:text-xl font-medium shadow-2xl text-white">
                "{caption}"
                <div className="text-xs text-cyan-300 mt-2 flex justify-center items-center gap-1">
                  <Languages className="w-3 h-3" /> Live Translation
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar - Bottom Floating */}
          <div className="absolute top-6 right-6 hidden xl:flex flex-col gap-3 w-[260px] z-30">
            <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3">
                Meeting summary
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Local</span>
                  <span className="text-white">
                    {currentUser?.name || "You"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Remote</span>
                  <span
                    className={`text-sm font-semibold ${remoteConnected ? "text-emerald-300" : "text-slate-500"}`}
                  >
                    {remoteConnected ? "Connected" : "Waiting"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Elapsed</span>
                  <span className="text-white">
                    {formatElapsedTime(elapsedSeconds)}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl text-slate-300">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-2">
                Quick tips
              </p>
              <ul className="list-disc pl-4 text-xs space-y-2">
                <li>Share your meeting code after camera ready.</li>
                <li>Use chat to send quick links or file attachments.</li>
                <li>Press Translate while speaking for live captions.</li>
              </ul>
            </div>
          </div>
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 z-40 shadow-2xl w-[95%] md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={toggleMic}
              className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full transition-all flex items-center justify-center ${isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white"}`}
            >
              {isMicOn ? (
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <MicOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full transition-all flex items-center justify-center ${isVideoOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white"}`}
            >
              {isVideoOn ? (
                <Video className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <VideoOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

            <button
              onClick={toggleScreenShare}
              title="Share Screen"
              className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full transition-all flex items-center justify-center ${isScreenSharing ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-white/10 hover:bg-white/20 text-white"}`}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            <button
              onClick={toggleTranslation}
              title="Live Translation"
              className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full transition-all flex items-center justify-center ${isTranslating ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-white/10 hover:bg-white/20 text-white"}`}
            >
              <Languages className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              title="Chat"
              className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full transition-all flex items-center justify-center md:hidden ${isChatOpen ? "bg-indigo-500 text-white" : "bg-white/10 text-white"}`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

            <button
              onClick={endCall}
              disabled={!isConnected}
              className="px-4 md:px-6 h-10 md:h-12 shrink-0 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white font-medium transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 text-sm md:text-base"
            >
              <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />{" "}
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* Side Chat Panel */}
        <div
          className={`absolute md:relative top-0 right-0 h-full w-full md:w-[320px] bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col transition-transform duration-300 z-50 ${isChatOpen ? "translate-x-0" : "translate-x-full md:hidden"}`}
        >
          <div className="h-16 px-4 border-b border-white/10 font-medium flex items-center justify-between shrink-0 glass">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              In-Call Chat
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white p-2 md:hidden"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {!isConnected && (
              <div className="text-xs text-gray-500 text-center mt-4">
                Connect to a call to chat securely with your peer.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-gray-500 mb-1">
                  {msg.sender} • {msg.time}
                </span>
                <div
                  className={`px-3 py-2 rounded-xl max-w-[90%] text-sm break-words ${msg.sender === "You" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/10 text-gray-200 rounded-tl-sm"}`}
                >
                  {msg.isFile ? (
                    <a
                      href={msg.fileUrl}
                      download={msg.fileName}
                      className="underline text-cyan-200 hover:text-cyan-100"
                    >
                      {msg.fileName || "Download file"}
                    </a>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 bg-black/50 shrink-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 hover:bg-white/10 transition-colors">
                  Select file
                  <input
                    type="file"
                    accept="*/*"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={sendFile}
                  disabled={!isConnected || !selectedFile}
                  className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  Send file
                </button>
                {selectedFile && (
                  <span className="text-xs text-slate-300 truncate max-w-[160px]">
                    {selectedFile.name}
                  </span>
                )}
              </div>
              {transferNotice && (
                <p className="text-xs text-emerald-300">{transferNotice}</p>
              )}
              <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1 focus-within:border-indigo-500/50 transition-colors">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  disabled={!isConnected}
                  placeholder="Type message..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-white placeholder:text-gray-500 disabled:opacity-50 min-w-0"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!isConnected || !chatInput.trim()}
                  className="p-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
