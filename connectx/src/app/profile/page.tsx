"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Save,
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  Upload,
  X,
  Check,
} from "lucide-react";
import { getCurrentUser, logoutUser, setCurrentUser } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    const loggedInUser = getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
      setFormData({
        name: loggedInUser.name || "",
        email: loggedInUser.email || "",
        phone: loggedInUser.phone || "",
        location: loggedInUser.location || "",
      });
      setProfileImage(loggedInUser.avatar || ""); // avatar is used for profile images in lib/auth types
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        ...formData,
        avatar: profileImage,
      };
      setCurrentUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      {/* Header */}
      <header className="border-b border-indigo-200 glass sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-indigo-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-900" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Profile Settings
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {saved && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-700 font-medium">
            <Check className="w-5 h-5" />
            Profile updated successfully! 🎉
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Profile Image */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 border-indigo-200 sticky top-24">
              <h3 className="font-bold text-lg text-slate-900 mb-4">
                Profile Picture
              </h3>

              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center mx-auto shadow-lg">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-20 h-20 text-white opacity-50" />
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  <strong>Name:</strong> {formData.name}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Email:</strong> {formData.email}
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  💡 Click the camera icon to upload a new profile picture
                </p>
              </div>
            </div>
          </div>

          {/* Main Content - Edit Form */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-8 border-indigo-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Edit Profile Information
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      Full Name
                    </div>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      Phone Number
                    </div>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Location
                    </div>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                    placeholder="Enter your location"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-indigo-200 flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-white border-2 border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 glass rounded-2xl p-6 border-indigo-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4">
                📝 About ConnectX
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                ConnectX is a modern communication platform that brings people
                together. With crystal-clear video calls, instant messaging, and
                real-time translation, you can connect with anyone, anywhere.
              </p>
              <p className="text-slate-600 text-sm">
                ✨ Stay connected, stay positive, stay productive!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
