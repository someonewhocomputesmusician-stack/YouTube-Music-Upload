/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TrackUpload {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  description: string;
  duration: string; // e.g. "3:45"
  fileSize: string; // e.g. "8.4 MB"
  fileName: string;
  uploadedAt: string;
  status: 'pending' | 'uploading' | 'processing' | 'failed' | 'completed';
  progress: number; // 0 to 100
  youtubeId?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  thumbnailUrl: string;
  youtubeId?: string;
}

export interface ApiCredentials {
  key: string;
  host: string;
  isConfigured: boolean;
  source: 'env' | 'user' | 'none';
}

export interface MetadataOptimization {
  title: string;
  artist: string;
  album: string;
  genre: string;
  description: string;
  tags: string[];
}
