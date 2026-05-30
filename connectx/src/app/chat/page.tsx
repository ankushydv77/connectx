"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Trash2,
  LogOut,
  Sparkles,
  Check,
  AlertCircle,
  Settings
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getCurrentUser, logoutUser, setCurrentUser } from "@/lib/auth";

export default function ChatPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      text: string;
      sender: string;
      time: string;
      isFile?: boolean;
      fileName?: string;
    }>
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    newSocket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
      setRemoteTyping(false); // Clear typing when message received
    });

    newSocket.on("typing", () => {
      setRemoteTyping(true);
      // Auto clear typing after 3 seconds if no new typing event
      setTimeout(() => setRemoteTyping(false), 3000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const loggedInUser = getCurrentUser();
    if (!loggedInUser) {
      router.push("/login");
      return;
    }

    setUser(loggedInUser);
    setEditName(loggedInUser.name || "");
    setEditEmail(loggedInUser.email || "");
    setEditPhone(loggedInUser.phone || "");
    setEditAvatar(loggedInUser.avatar || "");
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteTyping]);

  const saveUserToStorage = (updatedUser: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  }) => {
    setCurrentUser(updatedUser as any);
    setUser(updatedUser);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setProfileMessage("");
    setProfileError("");

    try {
      const res = await fetch(`http://localhost:5000/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          avatar: editAvatar,
          password: editPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to update profile");
      }

      saveUserToStorage(data.user);
      setProfileMessage("Profile updated successfully.");
      setIsEditing(false);
      setEditPassword("");
    } catch (error: any) {
      setProfileError(error.message || "Update failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Delete your account permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/user/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      logoutUser();
      router.push("/login");
    } catch (error: any) {
      setProfileError(error.message || "Delete failed");
    }
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing");
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendMessage = () => {
    if ((inputValue.trim() || selectedFile) && socket) {
      const msgData = {
        text: selectedFile ? "Sent a file" : inputValue,
        sender: "You",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isFile: !!selectedFile,
        fileName: selectedFile ? selectedFile.name : undefined,
      };

      socket.emit("send_message", msgData);

      setInputValue("");
      setSelectedFile(null);
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Header */}
      <header className="h-20 border-b border-white/10 flex items-center px-6 justify-between shrink-0 bg-slate-950/70 backdrop-blur-xl z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/30 rounded-full transition-all text-slate-300 hover:text-white hover:scale-105 active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="font-extrabold text-white flex items-center gap-2 tracking-tight">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              CONNECTX Global Lobby
            </div>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-0.5">Secure Network Broadcast</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/10 px-4 py-2 rounded-full shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400 hidden sm:inline">Live Lobby Synchronized</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Chat Feed Column */}
        <section className="flex-1 flex flex-col relative w-full h-full border-r border-white/5 bg-slate-900/20 backdrop-blur-md">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Scrollable Message Box */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 relative z-10 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto my-auto select-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400 shadow-lg shadow-indigo-500/5 animate-pulse">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-white text-lg tracking-tight">Lobby Chat Active</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2 font-medium">
                  Welcome to the CONNECTX Global Room! All messages, assets, and document uploads are broadcasted in real-time. Say hi to get started!
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isSelf = msg.sender === "You";
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${isSelf ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* User Avatar Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${
                        isSelf 
                          ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950" 
                          : "bg-gradient-to-tr from-pink-500 to-rose-500 text-white"
                      }`}
                    >
                      {msg.sender.charAt(0).toUpperCase()}
                    </div>

                    <div className={`flex flex-col gap-1.5 ${isSelf ? "items-end" : "items-start"}`}>
                      {/* Message Meta Info */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-350">{msg.sender}</span>
                        <span className="text-[9px] font-semibold text-slate-500">{msg.time}</span>
                      </div>

                      {/* Message Content Bubble */}
                      <div
                        className={`p-3.5 text-sm shadow-md transition-all ${
                          isSelf 
                            ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white rounded-2xl rounded-tr-none border border-indigo-500/30" 
                            : "bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.isFile ? (
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 rounded-xl">
                              {msg.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                                <ImageIcon className="w-5 h-5 text-cyan-300" />
                              ) : (
                                <FileText className="w-5 h-5 text-indigo-300" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold underline decoration-white/20 hover:text-white cursor-pointer transition-colors max-w-[180px] truncate">
                                {msg.fileName}
                              </span>
                              <span className="text-[10px] opacity-70 mt-0.5">Click to download asset</span>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Remote Partner Typing Bubble */}
            {remoteTyping && (
              <div className="flex gap-3 mr-auto items-center animate-pulse">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-400 shrink-0">
                  ...
                </div>
                <div className="bg-slate-800/50 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Controls Area */}
          <div className="p-4 border-t border-white/10 shrink-0 bg-slate-950/40 backdrop-blur-lg relative z-10">
            <div className="max-w-4xl mx-auto space-y-3">
              {/* File Attachment Notification */}
              {selectedFile && (
                <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/25 px-4 py-2.5 rounded-xl w-fit text-indigo-300 animate-scaleIn shadow-lg">
                  {selectedFile.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="text-xs font-semibold truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="hover:bg-indigo-500/20 p-1 rounded-lg text-indigo-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Text Input Row */}
              <div className="flex items-end gap-2 bg-slate-950/80 border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-inner">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="p-3 text-slate-400 hover:text-white transition-all rounded-xl hover:bg-slate-900 cursor-pointer hover:scale-105 active:scale-95"
                  title="Attach file or media"
                >
                  <Paperclip className="w-5 h-5" />
                </label>
                
                <textarea
                  value={inputValue}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    selectedFile
                      ? "Add a caption to the file..."
                      : "Type a secure message..."
                  }
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 text-sm py-2.5 px-3 text-white placeholder:text-slate-650 font-semibold"
                  rows={1}
                />

                <button
                  onClick={sendMessage}
                  className="p-3 text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 transition-all rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/10"
                  disabled={!inputValue.trim() && !selectedFile}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Details Sidebar */}
        <aside className="w-full md:w-[360px] border-t border-white/10 md:border-t-0 md:border-l border-white/10 bg-slate-955/65 backdrop-blur-xl p-6 overflow-y-auto shrink-0 scrollbar-thin">
          <div className="sticky top-0 bg-transparent pb-4 border-b border-white/10">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
              <Settings className="w-5 h-5 text-indigo-400" />
              Settings Panel
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Manage and customize your account credentials.</p>
          </div>

          <div className="mt-8 space-y-6">
            {/* Pulsing Avatar Frame */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group mb-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-indigo-500/10 relative transition-transform duration-300 group-hover:scale-[1.03]">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 bg-slate-900 border border-white/15 px-2 py-0.5 rounded-full text-[9px] font-bold text-cyan-400 uppercase tracking-wider shadow-md">
                  Active
                </div>
              </div>
              <p className="text-base font-bold text-white tracking-tight">{user?.name || "Lobby Member"}</p>
              <p className="text-xs text-slate-500 font-semibold">{user?.email || "No email synchronized"}</p>
            </div>

            {/* Read-Only Status Info Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mb-1">Account Role</p>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Enterprise Communicator</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mb-1">Phone Number</p>
                <p className="text-xs font-bold text-slate-200">{user?.phone || "Roster Not Synced"}</p>
              </div>
            </div>

            {/* Status Notifications */}
            {profileMessage && (
              <div className="rounded-xl p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="rounded-xl p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                {profileError}
              </div>
            )}

            {/* Profile Editing State Form */}
            <button
              onClick={() => setIsEditing((value) => !value)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isEditing 
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-white/10" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {isEditing ? "Dismiss Settings Roster" : "Update Credentials"}
            </button>

            {isEditing && (
              <div className="space-y-4 pt-3 border-t border-white/5 animate-fadeIn font-semibold">
                <div className="space-y-1.5 font-medium">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5 font-medium">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5 font-medium">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Phone Number</label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5 font-medium">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Avatar Image URL</label>
                  <input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="space-y-1.5 font-medium">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">New Password</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Unchanged (blank)"
                  />
                </div>
                <button
                  onClick={handleUpdateProfile}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-bold text-xs text-white transition-all shadow-md shadow-emerald-500/10 hover:scale-[1.02]"
                >
                  Save Workspace Credentials
                </button>
              </div>
            )}

            {/* Dangerous Area CTAs */}
            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-slate-905 hover:bg-slate-800 border border-white/5 hover:border-white/10 font-bold text-xs text-slate-300 hover:text-white transition-all hover:scale-[1.01]"
              >
                Sign Out Session
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 font-bold text-xs transition-all hover:scale-[1.01]"
              >
                Terminate Workspace Account
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
