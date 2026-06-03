/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, Sparkles, Music, Loader2, Info, CheckCircle2 } from "lucide-react";
import { MetadataOptimization, TrackUpload } from "../types";

interface UploadFormProps {
  onUploadSuccess: (track: TrackUpload) => void;
  customKey: string;
  customHost: string;
  customBearer: string;
}

export function UploadForm({ onUploadSuccess, customKey, customHost, customBearer }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Field States
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("Electronic");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Loading & UI States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAiSuccess, setShowAiSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
      // Pre-fill rough title from filename
      const cleanRoughName = droppedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanRoughName);
      setError(null);
    } else {
      setError("Please drop a valid audio file (MP3, WAV, M4A, etc.)");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const cleanRoughName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanRoughName);
      setError(null);
    }
  };

  const handleAiOptimize = async () => {
    if (!file) {
      setError("Please select or drop an audio file first so Gemini can analyze its filename.");
      return;
    }

    setIsOptimizing(true);
    setError(null);
    setShowAiSuccess(false);

    try {
      const response = await fetch("/api/gemini/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          promptText: promptText,
          customTitle: title,
          customArtist: artist
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze metadata.");
      }

      const data: MetadataOptimization = await response.json();
      
      // Map Gemini response to state
      setTitle(data.title || title);
      setArtist(data.artist || artist || "Independent Creator");
      setAlbum(data.album || album || "Single");
      setGenre(data.genre || genre);
      setDescription(data.description || description);
      setTags(data.tags || []);
      
      setShowAiSuccess(true);
      setTimeout(() => setShowAiSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setError(`AI Optimization failed: ${err.message}. You can still fill properties manually.`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("An audio file is required to execute upload.");
      return;
    }
    if (!title.trim()) {
      setError("A track title is required.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("artist", artist || "Independent Artist");
    formData.append("album", album || "Single");
    formData.append("genre", genre);
    formData.append("description", description || `Uploaded file: ${file.name}`);
    formData.append("customKey", customKey);
    formData.append("customHost", customHost);
    formData.append("customBearer", customBearer);

    try {
      const response = await fetch("/api/ytmusic/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to trigger upload.");
      }

      const resData = await response.json();
      onUploadSuccess(resData.track);

      // Reset form
      setFile(null);
      setTitle("");
      setArtist("");
      setAlbum("");
      setGenre("Electronic");
      setDescription("");
      setPromptText("");
      setTags([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during final submission.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-xl p-6" id="upload-panel">
      <h2 className="text-xl font-bold tracking-tight text-white mb-4 flex items-center gap-2">
        <Upload className="text-brand w-5 h-5 text-red-500" />
        New Track Uploader
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-900 text-red-400 rounded-lg text-sm flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showAiSuccess && (
        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Gemini AI successfully optimized track tags and created full description!</span>
        </div>
      )}

      <form onSubmit={handleUploadSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver 
              ? "border-red-500 bg-red-950/10" 
              : file 
                ? "border-emerald-600 bg-emerald-950/5" 
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
          }`}
          id="file-dropzone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*"
            className="hidden"
          />
          {file ? (
            <div className="flex flex-col items-center">
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500 mb-2">
                <Music className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{file.name}</p>
              <p className="text-xs text-zinc-400 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Audio Format Detected
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setTitle("");
                }}
                className="mt-3 text-xs text-red-500 hover:underline"
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-zinc-800/60 rounded-full text-zinc-400 mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-zinc-200">
                Drag and drop your audio file or click to browse
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports MP3, WAV, FLAC, AAC, M4A up to 25MB
              </p>
            </div>
          )}
        </div>

        {/* AI Co-Pilot Optimizer Section */}
        {file && (
          <div className="p-4 bg-gradient-to-r from-zinc-950 to-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                Gemini AI Companion Settings
              </label>
              <button
                type="button"
                onClick={handleAiOptimize}
                disabled={isOptimizing}
                className="px-3 py-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-full text-xs font-semibold flex items-center gap-1 transition-all"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Auto-Fill optimized tags
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Enter any description directions or details below (vibe, artist, album background), and ask Gemini to cleanly write the tags!
            </p>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Dreamy lofi track for study sessions. Artist is Horizon Waves..."
              className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 focus:ring-1 focus:ring-yellow-500 focus:outline-none"
            />
          </div>
        )}

        {/* Traditional Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Track Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midnight City"
              required
              className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2.5 focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Artist / Band</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. M83"
              className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2.5 focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Album</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="e.g. Hurry Up, We're Dreaming"
              className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2.5 focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Music Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2.5 focus:border-red-600 focus:outline-none"
            >
              <option value="Electronic">Electronic / Synthpop</option>
              <option value="Lo-fi">Lo-fi Beats / Ambient</option>
              <option value="Hip Hop">Hip Hop / Rap</option>
              <option value="Rock">Rock / Indie</option>
              <option value="Pop">Pop / Synthwave</option>
              <option value="Jazz">Jazz / Soul</option>
              <option value="Cinematic">Classical / Cinematic</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">YouTube Video Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Introduce this upload to your YouTube Music listeners..."
            className="w-full text-sm bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 focus:border-red-600 focus:outline-none resize-none"
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AI Tags:</span>
            {tags.map((tag, i) => (
              <span key={i} className="text-xs bg-zinc-800/80 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || isOptimizing || !file}
          className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:hover:bg-zinc-800 transition-colors duration-200 mt-2 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Ingesting and Transcoding Track...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Publish to YouTube Music Channel
            </>
          )}
        </button>
      </form>
    </div>
  );
}
