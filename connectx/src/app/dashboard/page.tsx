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
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 border-r border-indigo-200 flex flex-col glass z-10 shrink-0">
        <div className="h-20 flex items-center justify-center md:justify-start md:px-6 border-b border-indigo-200 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/25 shrink-0 text-white">
              C
            </div>
            <span className="font-bold tracking-tight hidden md:block text-indigo-600">
              CONNECTX
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
          <NavItem
            href="/dashboard"
            icon={<Folder />}
            label="Dashboard"
            active
          />
          <NavItem href="/chat" icon={<MessageSquare />} label="Messages" />
          <NavItem href="/demo" icon={<Video />} label="Video Calls" />
          <NavItem href="#" icon={<Users />} label="Contacts" />
          <div className="my-4 border-t border-indigo-200" />
          <NavItem href="/profile" icon={<Settings />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-indigo-200">
          <Link
            href="/profile"
            className="flex items-center gap-3 md:bg-indigo-100 md:p-3 rounded-xl cursor-pointer hover:bg-indigo-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 shrink-0 flex items-center justify-center font-bold text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-semibold truncate text-slate-800">
                {user?.name || "Guest User"}
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                Online
              </span>
            </div>
            <LogOut
              onClick={handleLogout}
              className="w-5 h-5 text-indigo-600 hidden md:block group-hover:scale-110 transition-transform"
            />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-indigo-200 flex items-center justify-between px-8 shrink-0 glass z-10">
          <h2 className="text-xl font-bold text-indigo-600">Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/60 border border-indigo-200 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-64 text-slate-900 placeholder-slate-500"
              />
            </div>
            <Link
              href="/demo"
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> New Meeting
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-cyan-500/5 to-blue-500/5 blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Welcome Section */}
            <div className="mb-8 bg-gradient-to-r from-indigo-100 to-cyan-100 rounded-2xl p-6 border border-indigo-200 shadow-sm">
              <h3 className="text-2xl font-bold text-indigo-900">
                Welcome back, {user?.name || "User"}! 👋
              </h3>
              <p className="text-indigo-700 mt-2">
                You're all set to have amazing conversations with your team.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Meetings"
                value="—"
                subtitle="Start your first call"
                icon={<Video className="w-6 h-6 text-pink-500" />}
              />
              <StatCard
                title="Active Chats"
                value="—"
                subtitle="No messages yet"
                icon={<MessageSquare className="w-6 h-6 text-indigo-600" />}
              />
              <StatCard
                title="Files Shared"
                value="—"
                subtitle="Upload files to get started"
                icon={<Folder className="w-6 h-6 text-cyan-500" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Chats */}
              <div className="lg:col-span-2 glass rounded-2xl p-6 border-indigo-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-slate-900">
                    Recent Conversations
                  </h3>
                  <Link
                    href="/chat"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="flex flex-col gap-3 text-center py-8">
                  <MessageSquare className="w-12 h-12 text-indigo-300 mx-auto" />
                  <p className="text-slate-600 font-medium">
                    No conversations yet
                  </p>
                  <p className="text-sm text-slate-500">
                    Start chatting to see conversations here
                  </p>
                  <Link
                    href="/chat"
                    className="mt-2 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Go to Messages
                  </Link>
                </div>
              </div>

              {/* Shared Files (Fulfills File Sharing UI Requirement) */}
              <div className="glass rounded-2xl p-6 border-indigo-200 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-slate-900">
                    Shared Files
                  </h3>
                  <button className="text-indigo-400 hover:text-indigo-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-col gap-3 flex-1 text-center py-8">
                  <Folder className="w-12 h-12 text-cyan-300 mx-auto" />
                  <p className="text-slate-600 font-medium">
                    No files shared yet
                  </p>
                  <p className="text-sm text-slate-500">
                    Upload files to share with your team
                  </p>
                </div>
                <button className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 hover:text-white hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Upload File
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

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
      className={`flex items-center gap-3 p-3 rounded-xl transition-all group
        ${active ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-600 hover:bg-indigo-50 hover:text-slate-800"}
      `}
    >
      <div
        className={`${active ? "text-indigo-700" : "text-slate-500 group-hover:text-slate-700"}`}
      >
        {icon}
      </div>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass p-6 rounded-2xl border-indigo-200 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <span className="text-slate-600 font-medium text-sm">{title}</span>
        <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-100 to-cyan-100">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

function ChatRow({
  name,
  message,
  time,
  unread = 0,
}: {
  name: string;
  message: string;
  time: string;
  unread?: number;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-colors group">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center font-bold text-white">
        {name.charAt(0)}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium truncate group-hover:text-indigo-700 transition-colors text-slate-800">
            {name}
          </h4>
          <span className="text-xs text-slate-400 shrink-0">{time}</span>
        </div>
        <p className="text-sm text-slate-500 truncate">{message}</p>
      </div>
      {unread > 0 && (
        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {unread}
        </div>
      )}
    </div>
  );
}

function FileRow({
  name,
  size,
  type,
}: {
  name: string;
  size: string;
  type: "pdf" | "image" | "doc" | "archive";
}) {
  let icon = <FileText className="w-5 h-5 text-slate-400" />;
  if (type === "pdf") icon = <FileText className="w-5 h-5 text-red-500" />;
  if (type === "image") icon = <FileImage className="w-5 h-5 text-blue-500" />;
  if (type === "archive") icon = <Folder className="w-5 h-5 text-amber-500" />;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors group">
      <div className="p-3 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
        {icon}
      </div>
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-medium truncate group-hover:text-indigo-700 transition-colors text-slate-800">
          {name}
        </h4>
        <span className="text-xs text-slate-500">{size}</span>
      </div>
    </div>
  );
}
