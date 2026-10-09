/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Playlist, Song } from './types/music';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { useMusicStore } from './store/useMusicStore';
import { supabase } from './supabaseClient.js';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';

// Player Components
import { AudioController } from './components/player/AudioController';
import { AudioPlayerBar } from './components/player/AudioPlayerBar';
import { KaraokeLyricsModal } from './components/player/KaraokeLyricsModal';
import { QueueDrawer } from './components/player/QueueDrawer';

// Main Views
import { ChartRankView } from './components/views/ChartRankView';
import { LibraryView } from './components/views/LibraryView';
import { GenresView } from './components/views/GenresView';
import { PlaylistDetailModal } from './components/views/PlaylistDetailModal';

// Auth Guard & Modals
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthModal } from './components/common/AuthModal';
import { PlaylistEditModal } from './components/common/PlaylistEditModal';
import { AddToPlaylistModal } from './components/common/AddToPlaylistModal';
import { SongUploadModal } from './components/common/SongUploadModal';

export default function App() {
  const { theme } = useThemeStore();
  const { checkSession } = useAuthStore();
  const { loadData, createPlaylist, updatePlaylist } = useMusicStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(['chart']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isUploadSongOpen, setIsUploadSongOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  // Sync theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial load & check for route-based modal/protection
  useEffect(() => {
    checkSession();
    loadData();

    // Listen for OAuth callbacks (e.g., Google OAuth sign in)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkSession();
        setIsAuthOpen(false);
      }
    });

    const checkInitialUrl = async () => {
      const path = window.location.pathname;
      if (path === '/login') {
        setIsAuthOpen(true);
      } else if (path === '/library') {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          window.history.pushState({}, '', '/login');
          setIsAuthOpen(true);
          setActiveTab('chart');
        } else {
          setActiveTab('library');
        }
      }
    };

    checkInitialUrl();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [checkSession, loadData]);

  const handleTabChange = useCallback(async (newTab: ActiveTab) => {
    if (newTab === activeTab) return;

    // Protect private pages with supabase.auth.getSession() — if no session, redirect to /login
    const isPrivate = newTab === 'library';
    if (isPrivate) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.history.pushState({}, '', '/login');
        setIsAuthOpen(true);
        return;
      }
    }

    const nextHistory = tabHistory.slice(0, historyIndex + 1);
    nextHistory.push(newTab);
    setTabHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setActiveTab(newTab);
  }, [activeTab, tabHistory, historyIndex]);

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setActiveTab(tabHistory[prev]);
    }
  };

  const handleForward = () => {
    if (historyIndex < tabHistory.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setActiveTab(tabHistory[next]);
    }
  };

  const handleSavePlaylist = async (title: string, description: string, coverUrl: string) => {
    if (playlistToEdit) {
      await updatePlaylist(playlistToEdit.id, title, description, coverUrl);
      setPlaylistToEdit(null);
    } else {
      await createPlaylist(title, description, coverUrl);
      setIsCreatePlaylistOpen(false);
    }
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    if (window.location.pathname === '/login') {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-white flex flex-col antialiased selection:bg-[var(--accent)] selection:text-white">
      {/* Hidden Audio Controller handles actual HTML5 audio tags and events */}
      <AudioController />

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zing MP3 Style Sidebar (Desktop) */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            onOpenCreatePlaylist={() => {
              setPlaylistToEdit(null);
              setIsCreatePlaylistOpen(true);
            }}
            onSelectPlaylist={(pl) => setSelectedPlaylist(pl)}
            onOpenUploadSong={() => setIsUploadSongOpen(true)}
          />
        </div>

        {/* Viewport Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen md:h-[calc(100vh-5.5rem)]">
          <Header
            onOpenAuth={() => {
              window.history.pushState({}, '', '/login');
              setIsAuthOpen(true);
            }}
            onOpenUploadSong={() => setIsUploadSongOpen(true)}
            onBack={handleBack}
            onForward={handleForward}
          />

          {/* Scrollable Main View Content */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 max-w-7xl w-full mx-auto pb-36 md:pb-28">
            {activeTab === 'chart' && (
              <ChartRankView onOpenAddToPlaylist={(song) => setAddToPlaylistSong(song)} />
            )}

            {activeTab === 'library' && (
              <ProtectedRoute onRedirectToLogin={() => setIsAuthOpen(true)}>
                <LibraryView
                  onOpenCreatePlaylist={() => {
                    setPlaylistToEdit(null);
                    setIsCreatePlaylistOpen(true);
                  }}
                  onSelectPlaylist={(pl) => setSelectedPlaylist(pl)}
                  onOpenAddToPlaylist={(song) => setAddToPlaylistSong(song)}
                />
              </ProtectedRoute>
            )}

            {activeTab === 'genres' && (
              <GenresView onOpenAddToPlaylist={(song) => setAddToPlaylistSong(song)} />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar onOpenAddToPlaylist={(song) => setAddToPlaylistSong(song)} />

      {/* Fullscreen Karaoke / Lyrics View */}
      <KaraokeLyricsModal />

      {/* Playing Queue Side Drawer */}
      <QueueDrawer />

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        playlist={selectedPlaylist}
        isOpen={Boolean(selectedPlaylist)}
        onClose={() => setSelectedPlaylist(null)}
        onEditPlaylist={(pl) => {
          setPlaylistToEdit(pl);
          setIsCreatePlaylistOpen(true);
        }}
      />

      {/* Add Song To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(addToPlaylistSong)}
        song={addToPlaylistSong}
        onClose={() => setAddToPlaylistSong(null)}
        onOpenCreatePlaylist={() => {
          setPlaylistToEdit(null);
          setIsCreatePlaylistOpen(true);
        }}
      />

      {/* Supabase Authentication Modal (Login / Sign Up) */}
      <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} />

      {/* Create / Edit Playlist Modal */}
      <PlaylistEditModal
        isOpen={isCreatePlaylistOpen}
        playlistToEdit={playlistToEdit}
        onClose={() => {
          setIsCreatePlaylistOpen(false);
          setPlaylistToEdit(null);
        }}
        onSave={handleSavePlaylist}
      />

      {/* Upload Song Modal */}
      <SongUploadModal
        isOpen={isUploadSongOpen}
        onClose={() => setIsUploadSongOpen(false)}
        onOpenAuth={() => {
          setIsUploadSongOpen(false);
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
