
import React from 'react';
import { Persona, UserProfile, PlaygroundSession } from '../types';
import { PlusCircle, Settings2, Trash2, Edit3, Ghost, Sun, Moon, Compass, Sparkles, Theater, MessageCircle, ChevronRight, History, Settings } from 'lucide-react';

interface SidebarProps {
  personas: Persona[];
  userProfile: UserProfile;
  activePersonaId: string | null;
  activeView: 'chamber' | 'playground';
  onViewChange: (view: 'chamber' | 'playground') => void;
  theme: 'light' | 'dark';
  width: number;
  onWidthResize: (newWidth: number) => void;
  onSelectPersona: (id: string) => void;
  onCreatePersona: () => void;
  onEditPersona: (persona: Persona) => void;
  onDeletePersona: (id: string) => void;
  onEditProfile: () => void;
  onToggleAnonymous: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  // Playground specific
  playgroundSessions: PlaygroundSession[];
  activePlaygroundId: string | null;
  onSelectPlayground: (id: string) => void;
  onNewPlayground: () => void;
  onDeletePlayground: (id: string) => void;
  // Mobile specific
  isMobile?: boolean;
  isMobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  personas,
  userProfile,
  activePersonaId,
  activeView,
  onViewChange,
  theme,
  width,
  onWidthResize,
  onSelectPersona,
  onCreatePersona,
  onEditPersona,
  onDeletePersona,
  onEditProfile,
  onToggleAnonymous,
  onToggleTheme,
  onOpenSettings,
  playgroundSessions,
  activePlaygroundId,
  onSelectPlayground,
  onNewPlayground,
  onDeletePlayground,
  isMobile = false,
  isMobileSidebarOpen = false,
  onCloseMobileSidebar
}) => {
  const isResizing = React.useRef(false);
  const personaListRef = React.useRef<HTMLDivElement>(null);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = React.useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 280 && newWidth <= 500) {
        onWidthResize(newWidth);
      }
    }
  }, [onWidthResize]);

  return (
    <div
      style={{ width: isMobile ? undefined : `${width}px` }}
      className={`h-full flex flex-col glass border-r border-white/20 dark:border-white/5 relative group/sidebar shrink-0 overflow-hidden ${isMobile ? `mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''}` : ''
        }`}
    >
      <div onMouseDown={startResizing} className="resizer-handle" />

      {/* Header Rebrand */}
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-3 tracking-tighter">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/20 ring-1 ring-white/20">
            <Compass className="text-white" size={24} />
          </div>
          Biso's Chamber
        </h1>

        {/* Navigation Switcher */}
        <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800/50 rounded-2xl mt-6 border border-stone-200 dark:border-stone-700/50 shadow-inner">
          <button
            onClick={() => onViewChange('chamber')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeView === 'chamber' ? 'bg-white dark:bg-stone-700 text-amber-600 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
          >
            <MessageCircle size={14} /> Chamber
          </button>
          <button
            onClick={() => onViewChange('playground')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeView === 'playground' ? 'bg-white dark:bg-stone-700 text-indigo-600 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
          >
            <Theater size={14} /> Theater
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div ref={personaListRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-6 py-6" tabIndex={-1}>
        {activeView === 'chamber' ? (
          <div>
            <div className="flex items-center justify-between px-2 mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 dark:text-stone-600">Manifested Souls</p>
              <Sparkles size={12} className="text-amber-500/40" />
            </div>
            <div className="space-y-4">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona.id);
                    if (isMobile && onCloseMobileSidebar) {
                      onCloseMobileSidebar();
                    }
                  }}
                  className={`group relative flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer transition-all duration-500 ${activePersonaId === persona.id
                    ? 'bg-white dark:bg-stone-800/80 shadow-xl dark:shadow-none border-stone-100 dark:border-stone-700/50 ring-1 ring-stone-900/5 dark:ring-white/5'
                    : 'hover:bg-white/40 dark:hover:bg-white/5 border-transparent opacity-70 hover:opacity-100'
                    } border`}
                >
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-stone-700 shadow-md flex-shrink-0 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 ${persona.color}`}>
                    <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate text-base tracking-tight">{persona.name}</h3>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate font-black uppercase tracking-widest mt-0.5">{persona.role}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditPersona(persona); }}
                      className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-full transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    {personas.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePersona(persona.id); }}
                        className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-2 mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 dark:text-stone-600">Theater Scripts</p>
              <History size={12} className="text-indigo-500/40" />
            </div>

            <button
              onClick={onNewPlayground}
              className="w-full mb-4 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-stone-200 dark:border-stone-700/50 rounded-[2rem] text-stone-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all"
            >
              <PlusCircle size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">New Session</span>
            </button>

            <div className="space-y-3">
              {playgroundSessions.length === 0 ? (
                <div className="py-10 text-center">
                  <Theater size={32} className="mx-auto text-stone-200 mb-4" />
                  <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">No scripts yet</p>
                </div>
              ) : (
                playgroundSessions
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map(session => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectPlayground(session.id);
                        if (isMobile && onCloseMobileSidebar) {
                          onCloseMobileSidebar();
                        }
                      }}
                      className={`group relative p-4 rounded-[2rem] cursor-pointer transition-all border ${activePlaygroundId === session.id
                        ? 'bg-white dark:bg-stone-800 shadow-lg border-stone-100 dark:border-stone-700'
                        : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-black text-stone-700 dark:text-stone-300 truncate uppercase tracking-tight">{session.title}</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeletePlayground(session.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex -space-x-2 overflow-hidden mb-2">
                        {session.cast?.slice(0, 3).map(member => {
                          const p = personas.find(pers => pers.id === member.personaId);
                          return (
                            <div key={member.personaId} className={`w-6 h-6 rounded-full border border-white dark:border-stone-900 ${p?.color || 'bg-stone-200'}`}>
                              <img src={p?.avatar} className="w-full h-full object-cover rounded-full" />
                            </div>
                          );
                        })}
                        {session.cast && session.cast.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[8px] font-bold text-stone-400">+{session.cast.length - 3}</div>
                        )}
                      </div>
                      <p className="text-[9px] text-stone-400 truncate italic">"{session.currentScene.slice(0, 40)}..."</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unified Footer Control Center */}
      <div className="p-6 bg-stone-50/50 dark:bg-stone-900/60 border-t border-white/20 dark:border-white/5 space-y-4">
        <button
          onClick={onEditProfile}
          className={`w-full group relative overflow-hidden p-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-[2rem] transition-all hover:shadow-2xl dark:hover:shadow-none flex items-center gap-4 ${userProfile.isAnonymous ? 'ghost-glow ring-2 ring-indigo-500/20' : 'hover:scale-[1.02]'}`}
        >
          {userProfile.isAnonymous && <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-indigo-500/20 via-transparent to-indigo-500/20 animate-pulse pointer-events-none" />}
          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm flex-shrink-0 transition-all relative z-10 ${userProfile.isAnonymous ? 'grayscale brightness-150 opacity-40 scale-90' : 'group-hover:scale-105'} ${userProfile.color}`}>
            <img src={userProfile.avatar} alt="You" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 relative z-10 text-left">
            <p className="text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.2em] mb-0.5">Manifestation</p>
            <h4 className="text-sm font-black text-stone-800 dark:text-stone-100 truncate uppercase tracking-tighter">
              {userProfile.isAnonymous ? 'The Hollow One' : userProfile.name}
            </h4>
          </div>
          <div className="p-2 bg-stone-50 dark:bg-stone-700/50 rounded-full text-stone-300 dark:text-stone-600 group-hover:text-stone-800 dark:group-hover:text-stone-300 transition-colors">
            <Settings2 size={14} />
          </div>
        </button>

        <div className="grid grid-cols-5 gap-2">
          <button onClick={onToggleAnonymous} title="Toggle Anonymous" className={`p-4 rounded-[1.5rem] border transition-all flex items-center justify-center ${userProfile.isAnonymous ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'}`}>
            <Ghost size={20} />
          </button>
          <button onClick={onToggleTheme} title="Toggle Theme" className="p-4 rounded-[1.5rem] border bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all flex items-center justify-center">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={onOpenSettings} title="Settings" className="p-4 rounded-[1.5rem] border bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all flex items-center justify-center">
            <Settings size={20} />
          </button>
          <button onClick={onCreatePersona} className="col-span-2 flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-[1.5rem] hover:bg-stone-800 dark:hover:bg-white active:scale-95 transition-all shadow-xl">
            <PlusCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Manifest</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
