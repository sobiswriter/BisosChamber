
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Playground from './components/Playground';
import PersonaModal from './components/PersonaModal';
import HistoryModal from './components/HistoryModal';
import ConfirmDialog from './components/ConfirmDialog';
import UserProfileModal from './components/UserProfileModal';
import SettingsModal from './components/SettingsModal';
import { Persona, Message, ChatSession, Attachment, UserProfile, PlaygroundSession, AppSettings } from './types';
import { DEFAULT_PERSONAS, AVATAR_PRESETS, COLORS } from './constants';
import { geminiService } from './services/geminiService';
import { Compass, Menu } from 'lucide-react';

const DEFAULT_USER: UserProfile = {
  name: 'Wanderer',
  bio: 'A seeker of cozy stories and warm conversations.',
  personality: 'Curious, empathetic, and kind.',
  interests: ['Reading', 'Stargazing', 'Rainy days'],
  avatar: AVATAR_PRESETS[1],
  color: COLORS[1],
  isAnonymous: false
};

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-3-flash-preview',
  showDateTimeContext: false
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'chamber' | 'playground'>('chamber');

  const [personas, setPersonas] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('cozychats-personas-v2');
    return saved ? JSON.parse(saved) : DEFAULT_PERSONAS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('cozychats-user-profile');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('cozychats-app-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cozychats-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('cozychats-sidebar-width');
    return saved ? parseInt(saved, 10) : 320;
  });

  const [activePersonaId, setActivePersonaId] = useState<string | null>(personas[0]?.id || null);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('cozychats-sessions-v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [playgroundSessions, setPlaygroundSessions] = useState<PlaygroundSession[]>(() => {
    const saved = localStorage.getItem('cozychats-playground-sessions-v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [activePlaygroundId, setActivePlaygroundId] = useState<string | null>(() => {
    const saved = localStorage.getItem('cozychats-active-playground-id');
    return saved || null;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isApiKeyMissing = !appSettings.apiKey;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault();
            const input = document.querySelector('textarea');
            input?.focus();
            break;
          case 'n':
            e.preventDefault();
            setEditingPersona(null);
            setIsModalOpen(true);
            break;
          case 'p':
            e.preventDefault();
            setActiveView('playground');
            break;
          case 'c':
            e.preventDefault();
            setActiveView('chamber');
            break;
          case 's':
            e.preventDefault();
            const sidebarList = document.querySelector('[tabindex="-1"]');
            (sidebarList as HTMLElement)?.focus();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveToLocal = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error("Storage quota exceeded! Try clearing some chats.");
        setConfirmState({
          isOpen: true,
          title: "Chamber Memoirs Full!",
          message: "Your sanctuary has run out of memory space. Please clear some older conversations or delete large attachments to save new memories.",
          onConfirm: () => setConfirmState(null)
        });
      }
    }
  }, []);

  useEffect(() => {
    document.body.className = `${theme}-theme ${theme}`;
    localStorage.setItem('cozychats-theme', theme);
  }, [theme]);

  useEffect(() => {
    saveToLocal('cozychats-personas-v2', personas);
  }, [personas, saveToLocal]);

  useEffect(() => {
    saveToLocal('cozychats-user-profile', userProfile);
  }, [userProfile, saveToLocal]);

  useEffect(() => {
    saveToLocal('cozychats-app-settings', appSettings);
  }, [appSettings, saveToLocal]);

  useEffect(() => {
    saveToLocal('cozychats-sessions-v3', sessions);
  }, [sessions, saveToLocal]);

  useEffect(() => {
    saveToLocal('cozychats-playground-sessions-v1', playgroundSessions);
  }, [playgroundSessions, saveToLocal]);

  useEffect(() => {
    if (activePlaygroundId) localStorage.setItem('cozychats-active-playground-id', activePlaygroundId);
    else localStorage.removeItem('cozychats-active-playground-id');
  }, [activePlaygroundId]);

  useEffect(() => {
    localStorage.setItem('cozychats-sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    if (activePersonaId && activeView === 'chamber') {
      const personaSessions = sessions.filter(s => s.personaId === activePersonaId);
      if (personaSessions.length === 0) {
        createNewChat();
      } else if (!activeSessionId || sessions.find(s => s.id === activeSessionId)?.personaId !== activePersonaId) {
        const sorted = [...personaSessions].sort((a, b) => b.updatedAt - a.updatedAt);
        setActiveSessionId(sorted[0].id);
      }
    }
  }, [activePersonaId, activeView, sessions]);

  const activePersona = personas.find(p => p.id === activePersonaId);
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession?.messages || [];

  const createNewChat = useCallback(() => {
    if (!activePersonaId) return;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      personaId: activePersonaId,
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  }, [activePersonaId]);

  const handleSendMessage = async (text: string, attachment?: Attachment, isScenario: boolean = false, scenarioImage?: Attachment) => {
    if (!activePersonaId || !activePersona || !activeSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || (attachment ? `Sent an ${attachment.type}` : ''),
      timestamp: Date.now(),
      attachment,
      isScenario,
      scenarioImage
    };

    const updatedMessages = [...currentMessages, userMessage];

    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      messages: updatedMessages,
      title: s.messages.length === 0 ? text.slice(0, 30) || 'Memory' : s.title,
      updatedAt: Date.now()
    } : s));

    setIsTyping(true);
    const responseText = await geminiService.getChatResponse(activePersona, userProfile, currentMessages, text, appSettings, attachment, isScenario);
    setIsTyping(false);

    const modelMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      messages: [...updatedMessages, modelMessage],
      updatedAt: Date.now()
    } : s));
  };

  const handleToggleAnonymous = () => {
    setUserProfile(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }));
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleResetApplication = () => {
    setConfirmState({
      isOpen: true,
      title: 'Collapse Sanctuary?',
      message: 'This will wipe all personas, messages, and theater scripts. This action is irreversible.',
      onConfirm: () => {
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  const handleSavePersona = (persona: Persona) => {
    if (editingPersona) {
      setPersonas(prev => prev.map(p => p.id === persona.id ? persona : p));
      setEditingPersona(null);
    } else {
      setPersonas(prev => [...prev, persona]);
      setActivePersonaId(persona.id);
    }
    setIsModalOpen(false);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setIsModalOpen(true);
  };

  const handleDeletePersona = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Release Soul?',
      message: 'This will forever separate this soul from the chamber. Are you certain?',
      onConfirm: () => {
        setPersonas(prev => prev.filter(p => p.id !== id));
        setSessions(prev => prev.filter(s => s.personaId !== id));
        if (activePersonaId === id) {
          const remaining = personas.filter(p => p.id !== id);
          setActivePersonaId(remaining.length > 0 ? remaining[0].id : null);
        }
        setConfirmState(null);
      }
    });
  };

  const handleDeleteSession = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Dissolve Memory?',
      message: 'This conversation thread will be unraveled from the chamber tapestry.',
      onConfirm: () => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) setActiveSessionId(null);
        setConfirmState(null);
      }
    });
  };

  const activePlaygroundSession = playgroundSessions.find(s => s.id === activePlaygroundId) || null;

  const handleUpdatePlayground = (session: PlaygroundSession) => {
    setPlaygroundSessions(prev => {
      const exists = prev.find(s => s.id === session.id);
      if (exists) return prev.map(s => s.id === session.id ? session : s);
      return [...prev, session];
    });
    setActivePlaygroundId(session.id);
  };

  const handleDeletePlayground = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Close Theater?",
      message: "This will dissolve the simulation and all its dialogue forever.",
      onConfirm: () => {
        setPlaygroundSessions(prev => prev.filter(s => s.id !== id));
        if (activePlaygroundId === id) setActivePlaygroundId(null);
        setConfirmState(null);
      }
    });
  };

  const handleExportChat = useCallback(() => {
    if (!activeSession) return;
    const data = JSON.stringify(activeSession, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chamber-session-${activeSession.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeSession]);

  const handleImportChat = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const session: ChatSession = JSON.parse(e.target?.result as string);
        if (session.id && Array.isArray(session.messages)) {
          const newSession = { ...session, id: Date.now().toString(), updatedAt: Date.now() };
          setSessions(prev => [...prev, newSession]);
          setActivePersonaId(newSession.personaId);
          setActiveSessionId(newSession.id);
        }
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden text-stone-800 dark:text-stone-100 ${theme}`}>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className={`hamburger-button ${isMobileSidebarOpen ? 'open' : ''}`}
          aria-label="Toggle menu"
        >
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      )}

      {/* Mobile Backdrop */}
      {isMobile && (
        <div
          className={`mobile-backdrop ${isMobileSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <Sidebar
        personas={personas}
        userProfile={userProfile}
        activePersonaId={activePersonaId}
        activeView={activeView}
        onViewChange={setActiveView}
        theme={theme}
        width={sidebarWidth}
        onWidthResize={setSidebarWidth}
        onSelectPersona={setActivePersonaId}
        onCreatePersona={() => {
          setEditingPersona(null);
          setIsModalOpen(true);
        }}
        onEditPersona={handleEditPersona}
        onDeletePersona={handleDeletePersona}
        onEditProfile={() => setIsProfileOpen(true)}
        onToggleAnonymous={handleToggleAnonymous}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        playgroundSessions={playgroundSessions}
        activePlaygroundId={activePlaygroundId}
        onSelectPlayground={setActivePlaygroundId}
        onNewPlayground={() => setActivePlaygroundId(null)}
        onDeletePlayground={handleDeletePlayground}
        isMobile={isMobile}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {isApiKeyMissing && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 px-6 flex items-center justify-between text-amber-600 dark:text-amber-400 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 animate-spin-slow" />
              <p className="text-sm font-medium">The chamber requires a light source. Please set your <span className="font-bold">Gemini API Key</span> to begin the simulation.</p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
            >
              Open Settings
            </button>
          </div>
        )}
        {activeView === 'chamber' ? (
          activePersona ? (
            <ChatWindow
              persona={activePersona}
              userProfile={userProfile}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              onClearChat={() => {
                setConfirmState({
                  isOpen: true,
                  title: 'Purge Chamber Memory?',
                  message: 'This will cleanse all messages from this specific conversation.',
                  onConfirm: () => {
                    if (activeSessionId) {
                      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s));
                    }
                    setConfirmState(null);
                  }
                });
              }}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onNewChat={createNewChat}
              onExportChat={handleExportChat}
              onImportChat={handleImportChat}
              isApiKeyMissing={isApiKeyMissing}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-stone-50/20 dark:bg-stone-900/40">
              <Compass className="text-amber-500 w-24 h-24 animate-pulse mb-10" />
              <h2 className="text-4xl font-black mb-4">The Chamber is Silent</h2>
              <button onClick={() => setIsModalOpen(true)} className="px-12 py-5 bg-stone-900 text-white font-black rounded-[2rem]">Manifest Soul</button>
            </div>
          )
        ) : (
          <Playground
            personas={personas}
            session={activePlaygroundSession}
            onUpdateSession={handleUpdatePlayground}
            onDeleteSession={handleDeletePlayground}
            theme={theme}
            settings={appSettings}
          />
        )}
      </main>

      {isModalOpen && <PersonaModal onClose={() => setIsModalOpen(false)} onSave={handleSavePersona} editPersona={editingPersona} />}
      {isProfileOpen && <UserProfileModal profile={userProfile} onClose={() => setIsProfileOpen(false)} onSave={(p) => { setUserProfile(p); setIsProfileOpen(false); }} />}
      {isHistoryOpen && <HistoryModal sessions={sessions.filter(s => s.personaId === activePersonaId)} activeSessionId={activeSessionId} onClose={() => setIsHistoryOpen(false)} onSelectSession={(id) => { setActiveSessionId(id); setIsHistoryOpen(false); }} onDeleteSession={handleDeleteSession} />}
      {isSettingsOpen && <SettingsModal settings={appSettings} onClose={() => setIsSettingsOpen(false)} onSave={setAppSettings} onResetData={handleResetApplication} />}
      {confirmState && <ConfirmDialog isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} confirmLabel="Execute" onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} />}
    </div>
  );
};

export default App;
