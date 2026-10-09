import React from 'react';
import { Compass, TrendingUp, FolderHeart, Database, Radio } from 'lucide-react';
import { ActiveTab } from '../../types/music';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'discover', label: 'Khám phá', icon: <Compass className="w-5 h-5" /> },
    { id: 'chart', label: '#itsChart', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'genres', label: 'Thể loại', icon: <Radio className="w-5 h-5" /> },
    { id: 'library', label: 'Thư viện', icon: <FolderHeart className="w-5 h-5" /> },
    { id: 'crud', label: 'CRUD', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-22 left-0 right-0 z-30 bg-[var(--bg-player)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] flex items-center justify-around py-2 px-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              isActive ? 'text-[var(--accent)] font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
