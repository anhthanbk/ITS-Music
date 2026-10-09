import React from 'react';
import { TrendingUp, FolderHeart, Radio } from 'lucide-react';
import { ActiveTab } from '../../types/music';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chart', label: 'ITS Entertainment', icon: <TrendingUp className="w-5 h-5 text-amber-400" /> },
    { id: 'genres', label: 'Thể loại', icon: <Radio className="w-5 h-5 text-purple-400" /> },
    { id: 'library', label: 'Thư viện', icon: <FolderHeart className="w-5 h-5 text-pink-400" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-[var(--bg-player)]/98 backdrop-blur-xl border-t border-[var(--border-subtle)] grid grid-cols-3 items-center px-2 shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`w-full h-full flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive ? 'text-[var(--accent)] font-bold scale-105' : 'text-neutral-400 hover:text-white opacity-80'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium leading-none tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
