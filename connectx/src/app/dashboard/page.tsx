"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Video,
  Folder,
  Users,
  Search,
  Settings,
  LogOut,
  Plus,
  FileText,
  FileImage,
  MoreVertical,
  Clock,
  Trash2,
  Download,
  UserPlus,
  Activity,
  Cpu,
  HardDrive,
  Shield,
  X,
  CheckCircle,
  ChevronRight,
  Play,
  Calendar,
  Briefcase,
  AlertCircle,
  Menu
} from "lucide-react";
import { getCurrentUser, logoutUser } from "@/lib/auth";
import io from "socket.io-client";

export default function DashboardPage() {
  const [role, setRole] = React.useState<"User" | "Admin">("User");
  const [user, setUser] = React.useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // Search Term
  const [searchQuery, setSearchQuery] = React.useState("");

  // Meetings State
  const [meetings, setMeetings] = React.useState<any[]>([]);

  // Dashboard Files State
  const [dashboardFiles, setDashboardFiles] = React.useState<any[]>([]);

  // Contacts State
  const [contacts, setContacts] = React.useState<any[]>([]);

  // Call Logs
  const [callLogs, setCallLogs] = React.useState<any[]>([]);

  // Active simulated audits for Admin Role
  const [auditLogs, setAuditLogs] = React.useState<string[]>([
    "CONNECTX Dashboard Core Engine initialized."
  ]);

  // Resource Usage Simulation
  const [systemMetrics, setSystemMetrics] = React.useState({
    cpu: 28,
    memory: 34,
    network: 15
  });

  // Modal Triggers
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = React.useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = React.useState(false);

  // New Meeting Form
  const [newMeetingTitle, setNewMeetingTitle] = React.useState("");
  const [newMeetingDate, setNewMeetingDate] = React.useState("");
  const [newMeetingTime, setNewMeetingTime] = React.useState("");
  const [newMeetingDuration, setNewMeetingDuration] = React.useState("30");

  // New Contact Form
  const [newContactName, setNewContactName] = React.useState("");
  const [newContactEmail, setNewContactEmail] = React.useState("");
  const [newContactRole, setNewContactRole] = React.useState("");
  const [newContactStatus, setNewContactStatus] = React.useState("online");

  // File Upload Reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch real-time contacts from backend DB
  const fetchRealTimeContacts = async (loggedInUser: any) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/users`);
      if (response.ok) {
        const allUsers = await response.json();
        // Filter out current user
        const otherUsers = allUsers.filter((u: any) => u.id !== loggedInUser.id);
        const avatarColors = [
          "from-pink-500 to-rose-500",
          "from-blue-500 to-indigo-500",
          "from-amber-500 to-orange-500",
          "from-emerald-500 to-teal-500",
          "from-purple-500 to-indigo-500",
          "from-cyan-500 to-blue-500"
        ];
        const mapped = otherUsers.map((u: any, idx: number) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: "Team Collaborator",
          status: "online",
          color: avatarColors[idx % avatarColors.length]
        }));
        setContacts(mapped);
        localStorage.setItem(`dashboard_contacts_${loggedInUser.id}`, JSON.stringify(mapped));
      }
    } catch (err) {
      console.error("Failed to load real-time users from backend database:", err);
    }
  };

  // Initial Data Syncer & Login Guard
  React.useEffect(() => {
    const loggedInUser = getCurrentUser();
    if (!loggedInUser) {
      window.location.href = "/login";
      return;
    }
    setUser(loggedInUser);

    const storedRole = localStorage.getItem(`dashboard_role_${loggedInUser.id}`) as "User" | "Admin" | null;
    if (storedRole) setRole(storedRole);

    const storedMeetings = localStorage.getItem(`dashboard_meetings_${loggedInUser.id}`);
    if (storedMeetings) setMeetings(JSON.parse(storedMeetings));

    const storedFiles = localStorage.getItem(`dashboard_files_${loggedInUser.id}`);
    if (storedFiles) setDashboardFiles(JSON.parse(storedFiles));

    const storedContacts = localStorage.getItem(`dashboard_contacts_${loggedInUser.id}`);
    if (storedContacts) setContacts(JSON.parse(storedContacts));
    else {
      fetchRealTimeContacts(loggedInUser);
    }

    const storedCallLogs = localStorage.getItem(`dashboard_call_logs_${loggedInUser.id}`);
    if (storedCallLogs) setCallLogs(JSON.parse(storedCallLogs));
  }, []);

  // Real-time socket updates & listener
  React.useEffect(() => {
    if (!user) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl);

    socket.on("connect", () => {
      addAuditLog(`Connected to real-time CONNECTX engine [Socket ID: ${socket.id}]`);
    });

    socket.on("receive_message", (data: any) => {
      addAuditLog(`[Broadcast Message] ${data.senderName || "System"}: ${data.text}`);
    });

    socket.on("participant_joined", (data: any) => {
      addAuditLog(`[Live Presence] Collaborator ${data.userName} joined meet lobby.`);
      fetchRealTimeContacts(user);
    });

    socket.on("participant_left", (data: any) => {
      addAuditLog(`[Live Presence] Collaborator left meet lobby.`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // System Metrics Tick Fluctuation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpu: Math.min(99, Math.max(10, prev.cpu + Math.floor(Math.random() * 9) - 4)),
        memory: Math.min(99, Math.max(15, prev.memory + Math.floor(Math.random() * 3) - 1)),
        network: Math.min(100, Math.max(5, prev.network + Math.floor(Math.random() * 7) - 3))
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Logger & Save Utilities
  const saveMeetings = (updated: any[]) => {
    setMeetings(updated);
    if (user) {
      localStorage.setItem(`dashboard_meetings_${user.id}`, JSON.stringify(updated));
    }
  };

  const saveFiles = (updated: any[]) => {
    setDashboardFiles(updated);
    if (user) {
      localStorage.setItem(`dashboard_files_${user.id}`, JSON.stringify(updated));
    }
  };

  const saveContacts = (updated: any[]) => {
    setContacts(updated);
    if (user) {
      localStorage.setItem(`dashboard_contacts_${user.id}`, JSON.stringify(updated));
    }
  };

  const addAuditLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setAuditLogs(prev => [`[${timeStr}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login";
  };

  const handleRoleChange = (newRole: "User" | "Admin") => {
    setRole(newRole);
    if (user) {
      localStorage.setItem(`dashboard_role_${user.id}`, newRole);
    }
    addAuditLog(`Switched authorization workspace context to: ${newRole}`);
  };

  // Schedule Call Action
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle || !newMeetingDate || !newMeetingTime) return;

    const part1 = Math.random().toString(36).substring(2, 5).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 5).toUpperCase();
    const generatedRoomId = `${part1}-${part2}`;

    const newMeeting = {
      id: `m_${Date.now()}`,
      title: newMeetingTitle,
      date: newMeetingDate,
      time: newMeetingTime,
      duration: newMeetingDuration,
      roomId: generatedRoomId,
      host: user?.name || "You",
      status: "scheduled"
    };

    const updated = [newMeeting, ...meetings];
    saveMeetings(updated);
    addAuditLog(`Scheduled new call: "${newMeetingTitle}" [Room: ${generatedRoomId}]`);

    // Reset Form
    setNewMeetingTitle("");
    setNewMeetingDate("");
    setNewMeetingTime("");
    setNewMeetingDuration("30");
    setIsNewMeetingModalOpen(false);
  };

  // Delete/Cancel Scheduled Call
  const deleteMeeting = (id: string, title: string) => {
    const updated = meetings.filter(m => m.id !== id);
    saveMeetings(updated);
    addAuditLog(`Cancelled meeting schedule: "${title}"`);
  };

  // File Upload Action
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;

        let type: "pdf" | "image" | "doc" | "archive" = "doc";
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "pdf") type = "pdf";
        else if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) type = "image";
        else if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) type = "archive";

        const formattedSize = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

        const newFileObj = {
          id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: formattedSize,
          type: type,
          date: new Date().toISOString().replace("T", " ").substring(0, 16),
          dataUrl: file.size < 2 * 1024 * 1024 ? dataUrl : "" // Base64 storage cap limit check
        };

        const updated = [newFileObj, ...dashboardFiles];
        saveFiles(updated);
        addAuditLog(`Uploaded dashboard file resource: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger File Input Trigger
  const triggerFileSelection = () => {
    fileInputRef.current?.click();
  };

  // Download File Action
  const downloadFile = (file: any) => {
    if (file.dataUrl) {
      const link = document.createElement("a");
      link.href = file.dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blob = new Blob([`Mock contents for large file resource ${file.name}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    addAuditLog(`Triggered system download for: ${file.name}`);
  };

  // Delete Dashboard File
  const deleteFile = (id: string, name: string) => {
    const updated = dashboardFiles.filter(f => f.id !== id);
    saveFiles(updated);
    addAuditLog(`Deleted dashboard file resource: ${name}`);
  };

  // Add Contact Action
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactEmail) return;

    const avatarColors = [
      "from-pink-500 to-rose-500",
      "from-blue-500 to-indigo-500",
      "from-amber-500 to-orange-500",
      "from-emerald-500 to-teal-500",
      "from-purple-500 to-indigo-500",
      "from-cyan-500 to-blue-500"
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const newContact = {
      id: `c_${Date.now()}`,
      name: newContactName,
      email: newContactEmail,
      role: newContactRole || "Colleague",
      status: newContactStatus,
      color: randomColor
    };

    const updated = [...contacts, newContact];
    saveContacts(updated);
    addAuditLog(`Added workspace contact: ${newContactName}`);

    // Reset Form
    setNewContactName("");
    setNewContactEmail("");
    setNewContactRole("");
    setNewContactStatus("online");
    setIsAddContactModalOpen(false);
  };

  // Delete Contact Action
  const deleteContact = (id: string, name: string) => {
    const updated = contacts.filter(c => c.id !== id);
    saveContacts(updated);
    addAuditLog(`Removed contact resource: ${name}`);
  };

  // Call Contact Shortcuts (Direct Join)
  const callContactDirectly = (contact: any) => {
    const part1 = Math.random().toString(36).substring(2, 5).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 5).toUpperCase();
    const generatedRoomId = `${part1}-${part2}`;

    const instantMeeting = {
      id: `m_${Date.now()}`,
      title: `Call with ${contact.name}`,
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString("en-US", { hour12: false }).substring(0, 5),
      duration: "45",
      roomId: generatedRoomId,
      host: user?.name || "You",
      status: "active"
    };

    saveMeetings([instantMeeting, ...meetings]);
    addAuditLog(`Initiated direct fast-call with ${contact.name} [Room: ${generatedRoomId}]`);
    window.location.href = `/meet-v2?room=${generatedRoomId}`;
  };

  // Filtering searches
  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = dashboardFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Counters computations
  const totalMeetingsCount = callLogs.length + meetings.length;
  const activeChatsCount = contacts.filter(c => c.status === "online" || c.status === "away").length;
  const sharedFilesCount = dashboardFiles.length;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/50 text-slate-800 overflow-hidden font-sans">
      {/* Hidden File Input Selector */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />

      {/* Sidebar Toggle Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200/80 flex flex-col bg-white shrink-0 shadow-lg md:shadow-sm transition-transform duration-300 md:translate-x-0 md:relative ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/25 shrink-0 text-white hover:scale-105 transition-transform duration-300">
              C
            </div>
            <span className="font-bold tracking-tight text-slate-900 bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              CONNECTX
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 md:hidden"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
          <NavItem href="/dashboard" icon={<Folder className="w-5 h-5" />} label="Dashboard" active />
          <NavItem href="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Messages" />
          <NavItem href="/meet-v2" icon={<Video className="w-5 h-5" />} label="Video Calls" />
          <div className="my-3 border-t border-slate-200/60" />
          <NavItem href="/profile" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-200/80">
          <div className="flex items-center gap-3 bg-slate-100/80 hover:bg-slate-200/80 p-3 rounded-xl cursor-pointer transition-colors group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 shrink-0 flex items-center justify-center font-bold text-white shadow-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-semibold truncate text-slate-800">
                {user?.name || "Guest User"}
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout session"
              className="p-1.5 hover:bg-white/80 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header Row */}
        <header className="h-20 border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 shrink-0 bg-white/70 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              title="Open menu"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-750 md:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">ConnectX Center</h2>
            
            {/* Dynamic Role Switcher */}
            <div className="bg-slate-100/80 p-1 rounded-full flex gap-1 items-center border border-slate-200 shadow-inner">
              <button
                onClick={() => handleRoleChange("User")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                  role === "User"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                User
              </button>
              <button
                onClick={() => handleRoleChange("Admin")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-1 ${
                  role === "Admin"
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Shield className="w-3 h-3" /> Admin
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time search filter */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-64 text-slate-800 placeholder-slate-400 transition-all duration-300"
              />
            </div>

            <button
              onClick={() => setIsNewMeetingModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Schedule Call
            </button>
          </div>
        </header>

        {/* Primary Dashboard Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/10 via-sky-100/10 to-indigo-100/15 blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto space-y-8 relative z-10">
            {/* User welcome block */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Welcome Back, {user?.name || "Collaborator"}! 👋
                </h3>
                <p className="text-slate-600 text-sm mt-1.5">
                  Your workspace is perfectly active. Logged in session type:{" "}
                  <span className="font-bold text-indigo-600 capitalize bg-indigo-50 px-2 py-0.5 rounded-full text-xs border border-indigo-100">
                    {role} Mode
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/meet-v2"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> Start Instant Call
                </Link>
              </div>
            </div>

            {/* Dynamic System Stats Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Calls History"
                value={String(totalMeetingsCount)}
                subtitle="Scheduled + Completed"
                icon={<Video className="w-6 h-6 text-indigo-600" />}
                color="border-indigo-100"
              />
              <StatCard
                title="Active Teammates"
                value={String(activeChatsCount)}
                subtitle={`${contacts.length - activeChatsCount} Currently Offline`}
                icon={<Users className="w-6 h-6 text-emerald-600" />}
                color="border-emerald-100"
              />
              <StatCard
                title="Dashboard Files Store"
                value={String(sharedFilesCount)}
                subtitle="Click folder to view cabinet"
                icon={<Folder className="w-6 h-6 text-cyan-600" />}
                color="border-cyan-100"
              />
            </div>

            {/* Admin Metrics Workspace */}
            {role === "Admin" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn duration-500">
                {/* Diagnostics Gauges */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-indigo-200/60 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-600" /> Infrastructure Diagnostics Panel
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
                    {/* CPU gauge */}
                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" className="stroke-slate-200 fill-transparent" strokeWidth="8" />
                          <circle cx="48" cy="48" r="40" className="stroke-indigo-600 fill-transparent transition-all duration-500" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * systemMetrics.cpu) / 100} />
                        </svg>
                        <span className="absolute font-bold text-slate-900 text-lg">{systemMetrics.cpu}%</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 mt-3">CPU Usage</span>
                    </div>

                    {/* MEMORY gauge */}
                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" className="stroke-slate-200 fill-transparent" strokeWidth="8" />
                          <circle cx="48" cy="48" r="40" className="stroke-cyan-500 fill-transparent transition-all duration-500" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * systemMetrics.memory) / 100} />
                        </svg>
                        <span className="absolute font-bold text-slate-900 text-lg">{systemMetrics.memory}%</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 mt-3">RAM Allocation</span>
                    </div>

                    {/* Bandwidth Load */}
                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" className="stroke-slate-200 fill-transparent" strokeWidth="8" />
                          <circle cx="48" cy="48" r="40" className="stroke-emerald-500 fill-transparent transition-all duration-500" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * systemMetrics.network) / 100} />
                        </svg>
                        <span className="absolute font-bold text-slate-900 text-lg">{systemMetrics.network} Mb/s</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 mt-3">Bandwidth Speed</span>
                    </div>
                  </div>
                </div>

                {/* Audit Stream Tracker */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-indigo-200/60 shadow-sm flex flex-col h-64 lg:h-auto">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 shrink-0">
                    <Shield className="w-5 h-5 text-indigo-600" /> Security Audit Log
                  </h3>
                  <div className="flex-1 overflow-y-auto bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2 select-all scrollbar-thin">
                    {auditLogs.map((log, index) => (
                      <div key={index} className="truncate">
                        <span className="text-indigo-400">&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Meetings Scheduler Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming scheduled roster */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Upcoming Meetings Schedule
                  </h3>
                  <button
                    onClick={() => setIsNewMeetingModalOpen(true)}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    + Schedule One
                  </button>
                </div>

                {filteredMeetings.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <Video className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No upcoming calls planned</p>
                    <p className="text-xs text-slate-400 mt-1">Schedule a meeting or start an instant room.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-3.5">
                    {filteredMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all duration-300"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{meeting.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {meeting.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" /> {meeting.time} ({meeting.duration}m)
                            </span>
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                              ID: {meeting.roomId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => deleteMeeting(meeting.id, meeting.title)}
                            title="Cancel meeting"
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/meet-v2?room=${meeting.roomId}`}
                            className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-[1.02]"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Call
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contacts Directory Manager */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Teammates Directory
                  </h3>
                  <button
                    onClick={() => setIsAddContactModalOpen(true)}
                    title="Add new contact colleague"
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                    <Users className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">Roster directory is empty.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                    {filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${contact.color} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                            {contact.name.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold truncate text-slate-800">{contact.name}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{contact.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* status indicator */}
                          <span
                            title={contact.status}
                            className={`w-2.5 h-2.5 rounded-full mr-1.5 ${
                              contact.status === "online"
                                ? "bg-emerald-500"
                                : contact.status === "away"
                                ? "bg-amber-500"
                                : "bg-slate-300"
                            }`}
                          />
                          <button
                            onClick={() => callContactDirectly(contact)}
                            title="Call contact immediately"
                            className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteContact(contact.id, contact.name)}
                            title="Delete contact"
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dashboard File Hub & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dashboard File Cabinet */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-indigo-600" /> Active Dashboard File Cabinet
                  </h3>
                  <button
                    onClick={triggerFileSelection}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    + Upload File
                  </button>
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <Folder className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No files uploaded yet</p>
                    <p className="text-xs text-slate-400 mt-1">Upload PDF, images, or documents to store them locally.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-2.5">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-4 hover:border-indigo-300 hover:bg-indigo-50/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2.5 rounded-lg bg-indigo-50 shrink-0 text-indigo-600 font-bold group-hover:scale-105 transition-transform">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold truncate text-slate-800">{file.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{file.size} • Uploaded {file.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            onClick={() => downloadFile(file)}
                            title="Download local copy"
                            className="p-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-600 hover:text-indigo-600 transition-all shadow-sm hover:scale-105"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteFile(file.id, file.name)}
                            title="Delete file"
                            className="p-2 bg-white border border-slate-200 hover:border-rose-300 rounded-lg text-slate-400 hover:text-rose-600 transition-all shadow-sm hover:scale-105"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={triggerFileSelection}
                  className="w-full mt-4 py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl bg-indigo-50/20 hover:bg-indigo-50/50 text-indigo-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Dashboard File
                </button>
              </div>

              {/* Call History Audit */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col h-[350px]">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 shrink-0">
                  <Clock className="w-5 h-5 text-indigo-600" /> Recent Completed Calls
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
                  {callLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{log.title}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{log.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Duration: {log.duration}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {log.participants} Joined
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MODAL 1: Schedule Call */}
      {isNewMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col relative animate-scaleIn duration-300">
            <button
              onClick={() => setIsNewMeetingModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1.5">
              <Calendar className="w-5 h-5 text-indigo-600" /> Schedule Meeting Room
            </h3>
            <p className="text-slate-500 text-xs mb-5">Fill in details to save this in your upcoming workspace meetings.</p>

            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sync & Sprint Planning"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newMeetingTime}
                    onChange={(e) => setNewMeetingTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Duration</label>
                <select
                  value={newMeetingDuration}
                  onChange={(e) => setNewMeetingDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/10 transition-colors"
              >
                Schedule & Save Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Contact */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col relative animate-scaleIn duration-300">
            <button
              onClick={() => setIsAddContactModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1.5">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Add Team Contact
            </h3>
            <p className="text-slate-500 text-xs mb-5">Create a contact roster listing to quickly start video calls with collaborators.</p>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Cooper"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alice@connectx.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Colleague Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. External Lead Specialist"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Initial Status</label>
                <select
                  value={newContactStatus}
                  onChange={(e) => setNewContactStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/10 transition-colors"
              >
                Add Member to Roster
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sidebar Navigation Link Item Component
function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group
        ${active ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/50 shadow-sm" : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-800"}
      `}
    >
      <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700"}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}

// Stats Metric Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl border ${color} flex flex-col gap-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{title}</span>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 font-semibold mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

// File extension helper icon parser
function getFileIcon(type: "pdf" | "image" | "doc" | "archive") {
  if (type === "pdf") return <FileText className="w-5 h-5 text-rose-500" />;
  if (type === "image") return <FileImage className="w-5 h-5 text-blue-500" />;
  if (type === "archive") return <Folder className="w-5 h-5 text-amber-500" />;
  return <FileText className="w-5 h-5 text-indigo-500" />;
}

