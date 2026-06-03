/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Settings, HelpCircle, Import, Loader2, Music, Key, Globe, EyeOff, Eye, CheckCircle } from "lucide-react";
import { SearchResult, ApiCredentials, TrackUpload } from "../types";

interface SearchSectionProps {
  customKey: string;
  setCustomKey: (val: string) => void;
  customHost: string;
  setCustomHost: (val: string) => void;
  customBearer: string;
  setCustomBearer: (val: string) => void;
  onImportTrack: (track: SearchResult) => void;
}

export function SearchSection({
  customKey,
  setCustomKey,
  customHost,
  setCustomHost,
  customBearer,
  setCustomBearer,
  onImportTrack
}: SearchSectionProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  // Status check for server-side key
  const [serverKeyStatus, setServerKeyStatus] = useState({
    gemini: false,
    rapidApiEnv: false,
    defaultHost: "youtube-music-api3.p.rapidapi.com"
  });

  const [importedTrackIds, setImportedTrackIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch state config on startup
    const checkConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          setServerKeyStatus({
            gemini: data.gemini,
            rapidApiEnv: data.rapidApi.hasKeyInEnv,
            defaultHost: data.rapidApi.defaultHost
          });
          if (data.rapidApi.defaultHost && !customHost) {
            setCustomHost(data.rapidApi.defaultHost);
          }
        }
      } catch (err) {
        console.error("Failed to load environment credentials status", err);
      }
    };
    
    checkConfig();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSource(null);

    try {
      const response = await fetch("/api/ytmusic/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          customKey: customKey,
          customHost: customHost || serverKeyStatus.defaultHost,
          customBearer: customBearer
        })
      });

      if (!response.ok) {
        throw new Error("Failed to search YouTube Music database.");
      }

      const data = await response.json();
      setResults(data.results || []);
      setSource(data.source);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const executeImport = (track: SearchResult) => {
    onImportTrack(track);
    setImportedTrackIds(prev => {
      const copy = new Set(prev);
      copy.add(track.id);
      return copy;
    });
  };

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-xl p-6" id="search-explorer">
      {/* Header and API configurations toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Search className="text-red-500 w-5 h-5" />
          Global Channel Search
        </h2>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg border transition-all ${
            showSettings 
              ? "bg-red-500/10 border-red-500 text-red-500" 
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
          }`}
          title="RapidAPI & Credentials Options"
          type="button"
          id="toggle-settings-btn"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Credentials Setting Dropdown */}
      {showSettings && (
        <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-xl mb-5 space-y-3" id="api-settings-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5 leading-none">
              <Key className="w-4 h-4 text-zinc-400" />
              Credentials Console
            </h3>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              Secure Proxying
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            By default, calls proxy using server keys or Gemini fallbacks. Overwrite these fields to point towards your active RapidAPI subscriptions (e.g. <strong>{serverKeyStatus.defaultHost}</strong>) instantly.
          </p>

          <div className="space-y-2 pt-1 border-t border-zinc-900">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">X-RapidAPI-Key</label>
                <span className="text-[10px] text-zinc-500">
                  {serverKeyStatus.rapidApiEnv ? "🔒 Env Key Active" : "No Key Active"}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder={serverKeyStatus.rapidApiEnv ? "Using env secret standard key..." : "e.g. d2f84cb713ms... (or input your signature)"}
                  className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 pr-9 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">X-RapidAPI-Host</label>
              <div className="relative">
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="e.g. youtube-music-api3.p.rapidapi.com"
                  className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 pr-9 focus:border-red-500 focus:outline-none"
                />
                <Globe className="absolute right-2 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Authorization Bearer Token (YouTube Music Uploads)</label>
              <div className="relative">
                <input
                  type="text"
                  value={customBearer}
                  onChange={(e) => setCustomBearer(e.target.value)}
                  placeholder="e.g. ya29.a0ARWdcv... (Optional dynamic auth token/Google Bearer)"
                  className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 pr-9 focus:border-red-500 focus:outline-none"
                />
                <Key className="absolute right-2 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All API keys are secured server-side to remain hidden from the browser.</span>
          </div>
        </div>
      )}

      {/* Embedded search bar form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube Music (e.g. Coldplay, Lofi study beats, Midnight)..."
            className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 pl-10 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-2.5 bg-red-600 font-semibold text-sm rounded-lg hover:bg-red-700 text-white disabled:bg-zinc-800 disabled:text-zinc-600 flex items-center gap-1.5 transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Information about source */}
      {source && (
        <div className="mb-3 text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
          <span>Search Engine Source:</span>
          <span className={`px-1.5 py-0.5 rounded text-xs leading-none ${
            source === "rapidapi" ? "bg-cyan-950 text-cyan-400" : "bg-yellow-950 text-yellow-400"
          }`}>{source === "rapidapi" ? "⚡ Live RapidAPI Server" : "✨ Real-time Gemini AI Generation (No Credentials fallback)"}</span>
        </div>
      )}

      {/* Results Rendering Card List */}
      {results.length > 0 ? (
        <div className="space-y-3 max-h-[385px] overflow-y-auto pr-1" id="search-results-list">
          {results.map((track) => {
            const hasBeenImported = importedTrackIds.has(track.id);
            return (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-900 rounded-lg gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.thumbnailUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop"}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded shadow-md border border-zinc-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white line-clamp-1 leading-normal">
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {track.artist} {track.album && `• ${track.album}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2shrink-0">
                  <span className="text-xs font-mono text-zinc-500 mr-2 shrink-0">{track.duration}</span>
                  {hasBeenImported ? (
                    <span className="text-xs bg-emerald-950 border border-emerald-900 text-emerald-400 px-2.5 py-1 rounded font-medium flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3 h-3" /> Imported
                    </span>
                  ) : (
                    <button
                      onClick={() => executeImport(track)}
                      className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 rounded font-bold border border-zinc-700 hover:border-red-605 transition-all flex items-center gap-1 shrink-0"
                      title="Import into your list"
                    >
                      <Import className="w-3.5 h-3.5" />
                      Import
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-zinc-850 rounded-lg bg-zinc-900/10">
          <div className="p-3 bg-zinc-900 rounded-full text-zinc-500 mb-2">
            <Music className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No search results loaded yet</p>
          <p className="text-xs text-zinc-650 mt-1 max-w-xs leading-normal">
            Type anything into the search bar to query artists, genres, or albums. Try searching "Lofi Chill" or "Coldplay"!
          </p>
        </div>
      )}
    </div>
  );
}
