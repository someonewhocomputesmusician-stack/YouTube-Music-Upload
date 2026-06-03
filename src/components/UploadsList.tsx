/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Play, Calendar, Trash2, Sliders, CheckCircle2, RefreshCw, AlertCircle, FileAudio, ExternalLink, HelpCircle } from "lucide-react";
import { TrackUpload } from "../types";

interface UploadsListProps {
  tracks: TrackUpload[];
  onDeleteTrack: (id: string) => void;
  onRefreshList: () => void;
}

export function UploadsList({ tracks, onDeleteTrack, onRefreshList }: UploadsListProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing'>('all');

  const filteredTracks = tracks.filter((track) => {
    if (filter === "completed") return track.status === "completed";
    if (filter === "processing") return track.status === "processing" || track.status === "uploading" || track.status === "pending";
    return true;
  });

  const getStatusStyle = (status: TrackUpload['status']) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "processing":
      case "uploading":
      case "pending":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      default:
        return "bg-zinc-800 text-zinc-400";
    }
  };

  const getStatusText = (status: TrackUpload['status']) => {
    switch (status) {
      case "completed":
        return "Published • YouTube Music Library";
      case "processing":
        return "Transcoding & Ingesting Video...";
      case "uploading":
        return "Transferring file stream to servers...";
      case "pending":
        return "In queue...";
      case "failed":
        return "Upload rejected";
      default:
        return "Analyzing status";
    }
  };

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-xl p-6" id="uploads-list-panel">
      {/* Top action and quick filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="text-red-500 w-5 h-5" />
            Your YouTube Music Channel
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Displaying tracks loaded in this sandbox environment. All uploads transcode recursively.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter selects */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg text-xs" id="status-filters">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === "all" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              All Tracks
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === "completed" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter("processing")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === "processing" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={onRefreshList}
            className="p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
            title="Refresh database"
            type="button"
            id="refresh-channels-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredTracks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4" id="tracks-grid">
          {filteredTracks.map((track) => {
            const isProcessing = track.status !== "completed" && track.status !== "failed";
            const youtubeWatchUrl = track.youtubeId ? `https://music.youtube.com/watch?v=${track.youtubeId}` : null;

            return (
              <div
                key={track.id}
                className="group relative bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-4 transition-all duration-200"
              >
                {/* Visual Cover/Thumbnail frame */}
                <div className="relative w-full md:w-32 h-32 md:h-24 bg-zinc-950 rounded-lg border border-zinc-800 shrink-0 overflow-hidden">
                  <img
                    src={track.thumbnailUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                      isProcessing ? "opacity-40 grayscale blur-[1px]" : "opacity-90"
                    }`}
                  />
                  {/* Playing Overlays */}
                  {!isProcessing && youtubeWatchUrl && (
                    <a
                      href={youtubeWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span className="p-2.5 bg-red-600 rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </span>
                    </a>
                  )}
                  {/* Loading spinner for processing */}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col bg-zinc-950/40 text-amber-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1 text-center">Transcoding</span>
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 leading-tight">
                        <span className="truncate">{track.title}</span>
                        {track.status === "completed" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs text-zinc-450 mt-1 font-medium truncate">
                        {track.artist} {track.album && `• ${track.album}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${getStatusStyle(track.status)}`}>
                        {track.status}
                      </span>
                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-1 px-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete from Channel"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
                    {track.description}
                  </p>

                  {track.error && (
                    <div className="mb-2.5 text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-amber-400">Proxy Integration Warning:</span>
                        <span className="leading-relaxed opacity-90">{track.error}</span>
                        <span className="block mt-1 text-[10px] text-zinc-450">
                          (The sandbox initiated local virtual fallback simulation so your testing session remains unblocked.)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rendering Progress bars */}
                  {isProcessing ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 animate-pulse" />
                          {getStatusText(track.status)}
                        </span>
                        <span className="font-mono text-zinc-400">{track.progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${track.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-y-1 bg-zinc-950/20 px-3 py-1.5 rounded-lg border border-zinc-850">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FileAudio className="w-3 h-3 text-zinc-500" />
                          {track.fileSize || "Size unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {new Date(track.uploadedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        {track.genre && (
                          <span className="text-zinc-400.font-medium px-2 py-0.5 bg-zinc-800 rounded">
                            {track.genre}
                          </span>
                        )}
                      </div>

                      {youtubeWatchUrl && (
                        <a
                          href={youtubeWatchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-400 hover:underline flex items-center gap-0.5 font-semibold transition-all shrink-0"
                        >
                          Watch Video <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-orange-950/5">
          <div className="p-4 bg-zinc-900 rounded-full text-zinc-600 mb-2">
            <Sliders className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-zinc-400">Your channel contains no matching tracks</p>
          <p className="text-xs text-zinc-550 mt-1 max-w-sm leading-relaxed">
            There are no uploads matching this filter. Switch the filters to "All Tracks" or upload your own files to see them transcoding live!
          </p>
        </div>
      )}
    </div>
  );
}
