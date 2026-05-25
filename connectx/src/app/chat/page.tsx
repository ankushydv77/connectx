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
} from "lucide-react";
import { io, Socket } from "socket.io-client";

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
    const newSocket = io("http://localhost:5000");
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
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setEditName(parsed.name || "");
      setEditEmail(parsed.email || "");
      setEditPhone(parsed.phone || "");
      setEditAvatar(parsed.avatar || "");
    } catch (error) {
      console.error("Failed to parse stored user", error);
      router.push("/login");
    }
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
    localStorage.setItem("user", JSON.stringify(updatedUser));
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
      localStorage.removeItem("user");
      router.push("/login");
    } catch (error: any) {
      setProfileError(error.message || "Delete failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
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
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="h-16 border-b border-white/10 flex items-center px-6 gap-4 shrink-0 glass">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          Global Chat Room
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-400">Online</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        <section className="flex-1 flex flex-col relative w-full max-w-full md:max-w-4xl mx-auto border-r border-white/5 shadow-2xl bg-black/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 relative z-10">
            <div className="text-center text-xs text-gray-500 my-4">
              Welcome to the Global Chat! Messages and files are broadcasted to
              all connected clients.
            </div>

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${msg.sender === "You" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${msg.sender === "You" ? "bg-gradient-to-tr from-pink-500 to-rose-500" : "bg-gradient-to-tr from-blue-500 to-indigo-500"}`}
                >
                  {msg.sender.charAt(0)}
                </div>
                <div
                  className={`flex flex-col gap-1 ${msg.sender === "You" ? "items-end" : ""}`}
                >
                  <div
                    className={`flex items-baseline gap-2 ${msg.sender === "You" ? "flex-row-reverse" : ""}`}
                  >
                    <span className="font-semibold text-sm">{msg.sender}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>

                  <div
                    className={`p-3 text-sm shadow-md max-w-md break-words ${msg.sender === "You" ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none border border-indigo-500/50" : "bg-white/5 text-gray-200 rounded-2xl rounded-tl-none border border-white/5"}`}
                  >
                    {msg.isFile ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          {msg.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <ImageIcon className="w-6 h-6" />
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium underline decoration-white/30 cursor-pointer">
                            {msg.fileName}
                          </span>
                          <span className="text-xs opacity-70">
                            Click to download
                          </span>
                        </div>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            ))}

            {remoteTyping && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 bg-gradient-to-tr from-blue-500 to-indigo-500 text-transparent">
                  P
                </div>
                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-1 h-10">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 shrink-0 glass relative z-10">
            {selectedFile && (
              <div className="max-w-4xl mx-auto mb-3 flex items-center gap-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl w-fit">
                {selectedFile.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="hover:bg-white/10 p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-indigo-500/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
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
                    ? "Add a message (optional)..."
                    : "Type a message..."
                }
                className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 text-sm py-2 px-2 text-white placeholder:text-gray-600"
                rows={1}
              />
              <button
                onClick={sendMessage}
                className="p-2 text-white bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50"
                disabled={!inputValue.trim() && !selectedFile}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <aside className="w-full md:w-[360px] border-t border-white/10 md:border-t-0 md:border-l border-white/10 bg-[#060607] glass p-4 overflow-y-auto">
          <div className="sticky top-0 bg-[#060607] py-4">
            <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
            <p className="text-sm text-gray-400">
              Manage your account while you chat.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-2xl font-bold text-white">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-lg font-semibold">{user?.name || "Guest"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="glass p-4 rounded-3xl border border-white/10">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">
                  Email
                </p>
                <p className="text-sm text-gray-200 break-all">
                  {user?.email || "-"}
                </p>
              </div>
              <div className="glass p-4 rounded-3xl border border-white/10">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">
                  Phone
                </p>
                <p className="text-sm text-gray-200">
                  {user?.phone || "Not set"}
                </p>
              </div>
            </div>

            {profileMessage && (
              <div className="rounded-3xl p-3 bg-green-500/10 border border-green-500/20 text-green-200 text-sm">
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="rounded-3xl p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                {profileError}
              </div>
            )}

            <button
              onClick={() => setIsEditing((value) => !value)}
              className="w-full py-3 rounded-3xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold"
            >
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>

            {isEditing && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-[0.25em]">
                    Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-[0.25em]">
                    Email
                  </label>
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-[0.25em]">
                    Phone
                  </label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-[0.25em]">
                    Avatar URL
                  </label>
                  <input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-[0.25em]">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none"
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <button
                  onClick={handleUpdateProfile}
                  className="w-full py-3 rounded-3xl bg-emerald-500 hover:bg-emerald-400 transition-colors text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-3xl bg-white/10 hover:bg-white/20 transition-colors text-white font-semibold"
              >
                Logout
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-full py-3 rounded-3xl bg-red-600 hover:bg-red-500 transition-colors text-white font-semibold"
              >
                Delete Account
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
