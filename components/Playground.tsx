
import React, { useState, useRef, useEffect } from 'react';
import { Persona, Message, PlaygroundSession, CastMember, AppSettings } from '../types';
import { Theater, Play, Plus, Zap, Trash2, X, Sparkles, ChevronRight, UserPlus, FileText, Pause, Download, FileUp, ListOrdered, UserCheck, ArrowUp, ArrowDown } from 'lucide-react';
import TypingText from './TypingText';
import { geminiService } from '../services/geminiService';

interface PlaygroundProps {
  personas: Persona[];
  session: PlaygroundSession | null;
  onUpdateSession: (session: PlaygroundSession) => void;
  onDeleteSession: (id: string) => void;
  theme: 'light' | 'dark';
  settings: AppSettings;
}

const Playground: React.FC<PlaygroundProps> = ({ personas, session, onUpdateSession, onDeleteSession, theme, settings }) => {
  const [isCasting, setIsCasting] = useState(!session);
  const [activeCast, setActiveCast] = useState<CastMember[]>(session?.cast || []);
  const [sessionTitle, setSessionTitle] = useState(session?.title || '');
  const [sceneInput, setSceneInput] = useState(session?.currentScene || '');
  const [eventInput, setEventInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [lastAnimatedId, setLastAnimatedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const autoPlayTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session?.messages, isTyping]);

  useEffect(() => {
    setIsCasting(!session);
    if (session) {
      setActiveCast(session.cast);
      setSceneInput(session.currentScene);
      setSessionTitle(session.title);
    }
  }, [session]);

  // Handle Auto Play Logic
  useEffect(() => {
    if (isAutoPlaying && !isTyping && session && !isCasting) {
      autoPlayTimeoutRef.current = window.setTimeout(() => {
        triggerNextTurn();
      }, 3000);
    }
    return () => {
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    };
  }, [isAutoPlaying, isTyping, session, isCasting]);

  const handleStartSession = () => {
    if (activeCast.length >= 2 && sceneInput.trim()) {
      const newSession: PlaygroundSession = {
        id: session?.id || Date.now().toString(),
        title: sessionTitle.trim() || `Tale of ${activeCast.length} Souls`,
        cast: activeCast,
        currentScene: sceneInput,
        messages: session?.messages || [],
        updatedAt: Date.now()
      };
      onUpdateSession(newSession);
      setIsCasting(false);
    }
  };

  const triggerNextTurn = async () => {
    if (!session || isTyping) return;

    // Pick next persona strictly following the cast order
    const lastMessage = [...session.messages].reverse().find(m => !m.isScenario);
    const lastPersonaId = lastMessage?.personaId;

    let nextIndex = 0;
    if (lastPersonaId) {
      const lastCastIndex = session.cast.findIndex(c => c.personaId === lastPersonaId);
      nextIndex = (lastCastIndex + 1) % session.cast.length;
    }

    const castMemberConfig = session.cast[nextIndex];
    const nextPersona = personas.find(p => p.id === castMemberConfig.personaId)!;

    setIsTyping(true);
    const responseText = await geminiService.getPlaygroundTurn(
      nextPersona,
      castMemberConfig.sceneRole,
      session.cast.map(c => {
        const p = personas.find(pers => pers.id === c.personaId);
        return {
          name: p?.name || 'Unknown',
          role: p?.role || 'Unknown',
          sceneRole: c.sceneRole,
          personaId: c.personaId
        };
      }),
      session.messages,
      session.currentScene,
      settings
    );
    setIsTyping(false);

    const newMessageId = Date.now().toString();
    const newMessage: Message = {
      id: newMessageId,
      role: 'model',
      personaId: nextPersona.id,
      text: responseText,
      timestamp: Date.now()
    };

    setLastAnimatedId(newMessageId);
    onUpdateSession({
      ...session,
      messages: [...session.messages, newMessage],
      updatedAt: Date.now()
    });
  };

  const injectEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !eventInput.trim()) return;

    const eventMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: eventInput.trim(),
      timestamp: Date.now(),
      isScenario: true
    };

    onUpdateSession({
      ...session,
      messages: [...session.messages, eventMessage],
      updatedAt: Date.now()
    });
    setEventInput('');
  };

  const togglePersonaInCast = (personaId: string) => {
    const existingIndex = activeCast.findIndex(c => c.personaId === personaId);
    if (existingIndex > -1) {
      setActiveCast(activeCast.filter((_, i) => i !== existingIndex));
    } else if (activeCast.length < 4) {
      setActiveCast([...activeCast, { personaId, sceneRole: '' }]);
    }
  };

  const updateCastRole = (index: number, role: string) => {
    const updated = [...activeCast];
    updated[index].sceneRole = role;
    setActiveCast(updated);
  };

  const moveCastItem = (index: number, direction: 'up' | 'down') => {
    const updated = [...activeCast];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setActiveCast(updated);
  };

  const handleExport = () => {
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}_session.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as PlaygroundSession;
          if (imported.id && imported.cast && imported.messages) {
            onUpdateSession({
              ...imported,
              id: Date.now().toString(),
              updatedAt: Date.now()
            });
            setIsCasting(false);
          }
        } catch (err) {
          alert("Invalid session file.");
        }
      };
      reader.readAsText(file);
    }
  };

  if (isCasting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-stone-50/20 dark:bg-stone-900 overflow-y-auto">
        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
        <div className="max-w-3xl w-full glass p-10 rounded-[3rem] border-indigo-500/20 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-3">
            <div className="flex justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-xl">
                <Theater size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-stone-800 dark:text-white tracking-tight">The Casting Office</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm">Design your interactive drama. Set roles, order, and scene.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 flex items-center gap-2">
                  <Sparkles size={12} /> Script Title
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Midnight Whispers..."
                  className="w-full bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:outline-none text-stone-800 dark:text-white text-sm shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Select Cast Souls</label>
                <div className="grid grid-cols-4 gap-3">
                  {personas.map(p => {
                    const isSelected = activeCast.some(c => c.personaId === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePersonaInCast(p.id)}
                        className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative ${isSelected ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-md' : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-800/40 opacity-60'}`}
                      >
                        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-stone-700 ${p.color}`}>
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {activeCast.findIndex(c => c.personaId === p.id) + 1}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Define the Scene</label>
                <textarea
                  value={sceneInput}
                  onChange={(e) => setSceneInput(e.target.value)}
                  placeholder="Describe the environment and the starting situation..."
                  className="w-full bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 p-6 rounded-2xl focus:ring-2 focus:ring-indigo-500/30 focus:outline-none text-stone-800 dark:text-white text-sm resize-none h-40 shadow-inner leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 flex items-center gap-2">
                <ListOrdered size={12} /> Turn Order & Specific Roles
              </label>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {activeCast.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-3xl opacity-30">
                    <UserPlus size={40} className="mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">No actors cast yet</p>
                  </div>
                ) : (
                  activeCast.map((c, idx) => {
                    const p = personas.find(pers => pers.id === c.personaId);
                    return (
                      <div key={c.personaId} className="p-4 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl shadow-sm animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveCastItem(idx, 'up')} className="text-stone-300 hover:text-indigo-500 transition-colors disabled:opacity-10" disabled={idx === 0}><ArrowUp size={14} /></button>
                            <button onClick={() => moveCastItem(idx, 'down')} className="text-stone-300 hover:text-indigo-500 transition-colors disabled:opacity-10" disabled={idx === activeCast.length - 1}><ArrowDown size={14} /></button>
                          </div>
                          <div className={`w-10 h-10 rounded-full border-2 border-white dark:border-stone-900 ${p?.color}`}>
                            <img src={p?.avatar} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black uppercase tracking-tight text-stone-800 dark:text-stone-200 truncate">{p?.name}</h4>
                            <p className="text-[9px] text-stone-400 font-bold uppercase truncate">{p?.role}</p>
                          </div>
                          <button onClick={() => togglePersonaInCast(c.personaId)} className="p-2 text-stone-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 opacity-40">
                            <UserCheck size={14} />
                          </div>
                          <input
                            type="text"
                            value={c.sceneRole}
                            onChange={(e) => updateCastRole(idx, e.target.value)}
                            placeholder="Acting as... (e.g. Grumpy Daughter)"
                            className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 py-2.5 pl-10 pr-4 rounded-xl text-[11px] focus:ring-1 focus:ring-indigo-500/30 outline-none text-stone-600 dark:text-stone-400"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => importInputRef.current?.click()}
              className="py-5 bg-white dark:bg-stone-800 border-2 border-dashed border-stone-100 dark:border-stone-700 text-stone-500 font-black rounded-3xl hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] shadow-sm"
            >
              <FileUp size={18} /> Import Script
            </button>
            <button
              disabled={activeCast.length < 2 || !sceneInput.trim()}
              onClick={handleStartSession}
              className="py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-600 text-white font-black rounded-3xl transition-all shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 uppercase tracking-[0.25em] text-xs"
            >
              Raise the Curtain <Sparkles size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-stone-50'}`}>
      {/* Top Cast Display */}
      <div className="p-2 md:p-4 glass-dark dark:bg-black/20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex -space-x-2 md:-space-x-4 overflow-hidden p-0.5 md:p-1">
            {session?.cast.map(c => {
              const p = personas.find(pers => pers.id === c.personaId);
              return (
                <div key={c.personaId} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-stone-900 ${p?.color} shadow-lg`} title={`${p?.name} as ${c.sceneRole}`}>
                  <img src={p?.avatar} className="w-full h-full object-cover rounded-full" />
                </div>
              );
            })}
            <button onClick={() => setIsCasting(true)} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-indigo-600 dark:hover:text-white transition-colors z-10" title="Modify Cast / Roles">
              <UserPlus size={14} className="md:w-4 md:h-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />
          <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-stone-600 dark:text-stone-300 truncate max-w-[120px] md:max-w-[200px]">
            {session?.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="p-2 text-stone-400 hover:text-emerald-500 transition-colors" title="Manual Save (JSON)">
            <Download size={18} />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {isAutoPlaying ? 'Automated Drama' : 'Manual Turns'}
          </div>
          <button onClick={() => session && onDeleteSession(session.id)} className="p-2 text-stone-400 hover:text-rose-500 transition-colors" title="End Show">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Script Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-12 space-y-8 md:space-y-12 custom-scrollbar relative">
        {/* Scene Setting */}
        <div className="max-w-2xl mx-auto mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/40 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mb-8">
            <FileText size={12} /> The Premise
          </div>
          <p className="text-stone-600 dark:text-stone-400 text-sm md:text-xl italic leading-relaxed font-serif">"{session?.currentScene}"</p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent mx-auto mt-10" />
        </div>

        {session?.messages.map((msg) => {
          if (msg.isScenario) {
            return (
              <div key={msg.id} className="flex justify-center animate-in fade-in zoom-in-95 duration-500 my-12">
                <div className="px-10 py-6 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 rounded-[3rem] text-indigo-600 dark:text-indigo-300 text-sm font-bold italic tracking-wide text-center max-w-xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 dark:text-indigo-500 mb-2">Stage Direction</span>
                  {msg.text}
                </div>
              </div>
            );
          }

          const persona = personas.find(p => p.id === msg.personaId);
          const castConfig = session?.cast.find(c => c.personaId === msg.personaId);
          const isAnimating = lastAnimatedId === msg.id;

          return (
            <div key={msg.id} className="flex items-start gap-3 md:gap-8 max-w-4xl mx-auto group animate-in slide-in-from-bottom-6 duration-700">
              <div className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-white dark:border-stone-700 shadow-2xl flex-shrink-0 mt-0.5 md:mt-1 transition-all group-hover:rotate-2 group-hover:scale-110 ${persona?.color}`}>
                <img src={persona?.avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 md:gap-3">
                  <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.25em] text-stone-400 dark:text-stone-500">
                    {persona?.name}
                  </h4>
                  <span className="w-1.5 h-px bg-stone-200 dark:bg-stone-800" />
                  <span className="text-[8px] md:text-[10px] font-bold text-indigo-500/60 dark:text-indigo-400/40 uppercase tracking-wider md:tracking-widest italic">
                    {castConfig?.sceneRole || persona?.role}
                  </span>
                </div>
                <div className="text-stone-800 dark:text-stone-100 text-base md:text-2xl font-medium leading-relaxed font-sans tracking-tight">
                  {isAnimating ? (
                    <TypingText text={msg.text} onComplete={() => setLastAnimatedId(null)} />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-8 max-w-4xl mx-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="space-y-3 py-2 flex-1">
              <div className="w-32 h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full" />
              <div className="w-full h-6 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl" />
              <div className="w-4/5 h-6 bg-stone-200/30 dark:bg-stone-800/30 rounded-2xl" />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-3 md:p-6 bg-white/40 dark:bg-stone-900 border-t border-stone-200 dark:border-white/5 relative z-10 transition-colors shadow-[0_-15px_40px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto flex gap-2 md:gap-4">
          <form onSubmit={injectEvent} className="flex-1 flex bg-white/80 dark:bg-stone-800/40 rounded-[2rem] md:rounded-[2.5rem] p-1 md:p-1.5 border border-stone-200 dark:border-white/5 ring-1 ring-stone-900/5 dark:ring-white/5 group-focus-within:ring-indigo-500/40 transition-all shadow-sm">
            <div className="flex items-center pl-3 md:pl-6 pr-2 md:pr-3 text-stone-400 group-focus-within:text-indigo-500 transition-colors">
              <Theater size={18} className="md:w-[22px] md:h-[22px]" />
            </div>
            <input
              type="text"
              value={eventInput}
              onChange={(e) => setEventInput(e.target.value)}
              placeholder="Direct a scenario shift..."
              className="flex-1 bg-transparent py-2.5 md:py-4 text-xs md:text-sm text-stone-700 dark:text-stone-200 focus:outline-none placeholder-stone-400 font-medium"
            />
            <button
              type="submit"
              disabled={!eventInput.trim() || isTyping}
              className="px-4 md:px-8 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-[2rem] font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all active:scale-95"
            >
              Cast Shift
            </button>
          </form>

          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all shadow-xl active:scale-90 ${isAutoPlaying ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-600 border border-stone-100 dark:border-stone-700'}`}
              title={isAutoPlaying ? 'Pause Drama' : 'Auto-Play Story'}
            >
              {isAutoPlaying ? <Pause size={20} className="md:w-6 md:h-6" fill="currentColor" /> : <Play size={20} className="md:w-6 md:h-6" fill="currentColor" />}
            </button>

            <button
              onClick={triggerNextTurn}
              disabled={isTyping || isAutoPlaying}
              className={`px-5 md:px-10 h-12 md:h-16 rounded-[1.5rem] md:rounded-[2rem] font-black text-[9px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.25em] flex items-center gap-2 md:gap-4 transition-all ${isTyping || isAutoPlaying ? 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30 active:scale-95'}`}
            >
              {isTyping ? 'Writing...' : 'Next Soul'} {!isTyping && <ChevronRight size={16} className="md:w-5 md:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
