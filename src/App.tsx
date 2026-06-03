/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Music, Layout, RefreshCw, BarChart2, Radio, Headphones, PlaySquare } from "lucide-react";
import { UploadForm } from "./components/UploadForm";
import { SearchSection } from "./components/SearchSection";
import { UploadsList } from "./components/UploadsList";
import { TrackUpload, SearchResult } from "./types";

export default function App() {
  const [tracks, setTracks] = useState<TrackUpload[]>([]);
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem("RAPID_API_USER_KEY") || "";
  });
  const [customHost, setCustomHost] = useState<string>(() => {
    return localStorage.getItem("RAPID_API_USER_HOST") || "";
  });
  const [customBearer, setCustomBearer] = useState<string>(() => {
    return localStorage.getItem("RAPID_API_USER_BEARER") || "";
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync keys to localstorage so they persist for development sessions
  useEffect(() => {
    localStorage.setItem("RAPID_API_USER_KEY", customKey);
  }, [customKey]);

  useEffect(() => {
    localStorage.setItem("RAPID_API_USER_HOST", customHost);
  }, [customHost]);

  useEffect(() => {
    localStorage.setItem("RAPID_API_USER_BEARER", customBearer);
  }, [customBearer]);

  const loadTracks = async () => {
    try {
      const response = await fetch("/api/ytmusic/uploads");
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
    } catch (err) {
      console.error("Failed to load tracks", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTracks();
  }, []);

  // Poll for track completion if there are any tracks in progress
  useEffect(() => {
    const hasActiveTranscoding = tracks.some(
      (track) => track.status !== "completed" && track.status !== "failed"
    );

    if (!hasActiveTranscoding) return;

    const interval = setInterval(() => {
      console.log("Polling transcoding upload state...");
      loadTracks();
    }, 3000); // Poll every 3 seconds while active

    return () => clearInterval(interval);
  }, [tracks]);

  const handleUploadSuccess = (newTrack: TrackUpload) => {
    setTracks((prev) => [newTrack, ...prev]);
  };

  const handleImportTrack = async (searchTrack: SearchResult) => {
    try {
      const response = await fetch("/api/ytmusic/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchTrack)
      });

      if (response.ok) {
        const data = await response.json();
        setTracks((prev) => [data.track, ...prev]);
      }
    } catch (err) {
      console.error("Failed to import search item into channel", err);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    try {
      const response = await fetch("/api/ytmusic/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        setTracks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete track", err);
    }
  };

  // Channel Metrics Calculations
  const totalTracks = tracks.length;
  const publishedCount = tracks.filter((t) => t.status === "completed").length;
  const processingCount = tracks.filter((t) => t.status !== "completed" && t.status !== "failed").length;
  const networkLinkedCount = tracks.filter((t) => t.fileSize === "Network Linked Stream").length;

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans" id="app-root">
      {/* Visual Navigation Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-650 flex items-center justify-center text-white bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-900/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none font-sans flex items-center gap-1.5 uppercase tracking-wider">
              yt music <span className="text-red-500 font-black text-xs lowercase px-1.5 py-0.5 bg-red-950/40 border border-red-900/30 rounded">uploader</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-tight mt-0.5">
              Secure full-stack rapidapi manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/50 border border-zinc-850 px-3 py-1.5 rounded-full">
            <Headphones className="w-3.5 h-3.5 text-red-500" />
            Active Session Database: Live
          </span>
          
          <button
            onClick={loadTracks}
            disabled={isLoading}
            className="p-2 border border-zinc-850 rounded-lg hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white disabled:opacity-40"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-500" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* At-a-glance Interactive Channel Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-ribbon">
          <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Total Library</p>
              <h4 className="text-2xl font-black text-white mt-2 leading-none font-mono">{totalTracks}</h4>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-400">
              <PlaySquare className="w-5 h-5 text-red-500" />
            </div>
          </div>

          <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Published</p>
              <h4 className="text-2xl font-black text-emerald-400 mt-2 leading-none font-mono">{publishedCount}</h4>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-emerald-450">
              <Headphones className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Sim Ingestion</p>
              <h4 className="text-2xl font-black text-amber-400 mt-2 leading-none font-mono">{processingCount}</h4>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-amber-400">
              <RefreshCw className={`w-5 h-5 ${processingCount > 0 ? "animate-spin" : ""}`} />
            </div>
          </div>

          <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Linked Streams</p>
              <h4 className="text-2xl font-black text-cyan-400 mt-2 leading-none font-mono">{networkLinkedCount}</h4>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-cyan-400">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dynamic Multi-module interactive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: New uploads, AI assistance form */}
          <div className="lg:col-span-5 space-y-8">
            <UploadForm
              onUploadSuccess={handleUploadSuccess}
              customKey={customKey}
              customHost={customHost}
              customBearer={customBearer}
            />
          </div>

          {/* Right panel: Global Directory Search Explorer & Published channel tracks */}
          <div className="lg:col-span-7 space-y-8">
            {/* Search Explorer with custom credential parameters overrides */}
            <SearchSection
              customKey={customKey}
              setCustomKey={setCustomKey}
              customHost={customHost}
              setCustomHost={setCustomHost}
              customBearer={customBearer}
              setCustomBearer={setCustomBearer}
              onImportTrack={handleImportTrack}
            />

            {/* In-Session state tracking grid */}
            <UploadsList
              tracks={tracks}
              onDeleteTrack={handleDeleteTrack}
              onRefreshList={loadTracks}
            />
          </div>
        </div>

      </main>

      {/* Aesthetic minimal footer */}
      <footer className="py-12 mt-12 border-t border-zinc-900 text-center text-zinc-600 text-xs">
        <p className="font-sans">YouTube Music Uploader Workspace © {new Date().getFullYear()}</p>
        <p className="text-[10px] text-zinc-700 mt-1 uppercase tracking-wider font-bold">
          Empowered by Gemini AI metadata engines & stand-alone cloud container instances.
        </p>
      </footer>
    </div>
  );
}
