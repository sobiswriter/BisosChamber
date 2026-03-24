
import React, { useState, useRef, useEffect } from 'react';
import { Persona, Message, Attachment, UserProfile } from '../types';
import { Send, Sparkles, Info, Trash2, Clock, PlusCircle, Paperclip, X, Download, FileUp, FileAudio, FileVideo, Zap, Theater, ImageIcon, Link as LinkIcon, Ghost } from 'lucide-react';
import TypingText from './TypingText';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatWindowProps {
  persona: Persona;
  userProfile: UserProfile;
  messages: Message[];
  onSendMessage: (text: string, attachment?: Attachment, isScenario?: boolean, scenarioImage?: Attachment) => void;
  isTyping: boolean;
  onClearChat: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
  onImportChat: (file: File) => void;
  isApiKeyMissing?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  persona,
  userProfile,
  messages,
  onSendMessage,
  isTyping,
  onClearChat,
  onOpenHistory,
  onNewChat,
  onExportChat,
  onImportChat,
  isApiKeyMissing
}) => {
  const [input, setInput] = useState('');
  const [scenarioInput, setScenarioInput] = useState('');
  const [scenarioUrl, setScenarioUrl] = useState('');
  const [showScenarioMode, setShowScenarioMode] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [pendingScenarioImage, setPendingScenarioImage] = useState<Attachment | null>(null);
  const [lastAnimatedId, setLastAnimatedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scenarioFileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && lastMsg.id !== lastAnimatedId && !lastAnimatedId) {
        setLastAnimatedId(lastMsg.id);
      }
    }
  }, [messages]);

  // Handle textarea vertical auto-expansion
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || pendingAttachment) && !isTyping) {
      onSendMessage(input.trim(), pendingAttachment || undefined, false);
      setInput('');
      setPendingAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleScenarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scenarioInput.trim() && !isTyping) {
      onSendMessage(scenarioInput.trim(), undefined, true, pendingScenarioImage || undefined);
      setScenarioInput('');
      setScenarioUrl('');
      setPendingScenarioImage(null);
      setShowScenarioMode(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimension 800px
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress to 60% quality
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>, isScenario: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      let type: Attachment['type'] = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('audio/')) type = 'audio';

      let base64 = '';
      if (type === 'image') {
        base64 = await compressImage(file);
      } else {
        // For audio/video keep as is but they are usually larger, 
        // user might need to be careful. 
        // For now, let's just do image as it's the most common.
        const reader = new FileReader();
        base64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const attach: Attachment = {
        type,
        url: base64, // Use base64 as the persistent URL
        mimeType: file.type,
        base64
      };

      if (isScenario) {
        setPendingScenarioImage(attach);
      } else {
        setPendingAttachment(attach);
      }
    }
  };

  const handleScenarioUrlBlur = () => {
    if (scenarioUrl.trim()) {
      setPendingScenarioImage({
        type: 'image',
        url: scenarioUrl.trim(),
        mimeType: 'image/jpeg',
      });
    }
  };

  const renderAttachment = (attachment: Attachment) => {
    const safeUrl = (attachment.url.startsWith('blob:') && attachment.base64) ? attachment.base64 : attachment.url;

    switch (attachment.type) {
      case 'image':
        return <img src={safeUrl} alt="Attached" className="max-w-full max-h-[400px] w-auto h-auto object-contain rounded-xl shadow-sm mb-2" />;
      case 'video':
        return <video src={safeUrl} controls className="max-w-full max-h-[400px] rounded-xl shadow-sm mb-2" />;
      case 'audio':
        return (
          <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 mb-2 flex items-center gap-3">
            <FileAudio size={20} className="text-amber-600" />
            <audio src={safeUrl} controls className="h-8 flex-1" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/30 dark:bg-stone-900/40 relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*" onChange={(e) => handleFileAttach(e, false)} />
      <input type="file" ref={scenarioFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileAttach(e, true)} />
      <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onImportChat(file);
      }} />

      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between glass sticky top-0 z-10 border-b border-white/20 dark:border-white/5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white dark:border-stone-700 shadow-lg ${persona.color}`}>
            <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-bold text-stone-800 dark:text-stone-100">{persona.name}</h2>
            <p className="text-xs md:text-sm text-amber-600 dark:text-amber-500 font-semibold">{persona.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 rounded-full border border-white dark:border-white/10 text-xs text-stone-500 dark:text-stone-400 mr-4">
            {userProfile.isAnonymous ? (
              <>
                <Ghost size={14} className="text-indigo-500" />
                <span className="italic">Anonymous Wanderer</span>
              </>
            ) : (
              <>
                <Info size={14} className="text-amber-500" />
                <span className="italic">Talking with {userProfile.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center bg-white/40 dark:bg-stone-800/40 p-1 md:p-1.5 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm">
            <button onClick={onNewChat} className="p-1.5 md:p-2 text-stone-500 dark:text-stone-400 hover:text-amber-600 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all" title="New Conversation">
              <PlusCircle size={18} className="md:w-5 md:h-5" />
            </button>
            <button onClick={onOpenHistory} className="p-1.5 md:p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all" title="Memory Lane">
              <Clock size={18} className="md:w-5 md:h-5" />
            </button>
            <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-0.5 md:mx-1" />
            <button onClick={() => importInputRef.current?.click()} className="hidden sm:flex p-1.5 md:p-2 text-stone-500 dark:text-stone-400 hover:text-blue-500 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all" title="Import Session (JSON)">
              <FileUp size={18} className="md:w-5 md:h-5" />
            </button>
            <button onClick={onExportChat} className="hidden sm:flex p-1.5 md:p-2 text-stone-500 dark:text-stone-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all" title="Export Session (JSON)">
              <Download size={18} className="md:w-5 md:h-5" />
            </button>
            <div className="hidden sm:block w-px h-4 bg-stone-200 dark:bg-stone-700 mx-0.5 md:mx-1" />
            <button onClick={onClearChat} className="p-1.5 md:p-2 text-stone-400 dark:text-stone-500 hover:text-rose-500 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all" title="Clear Current Chat">
              <Trash2 size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 md:space-y-10 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className={`w-28 h-28 rounded-full mb-6 ${persona.color} p-1 flex items-center justify-center border-4 border-white dark:border-stone-700 shadow-2xl`}>
              <Sparkles size={56} className="text-white opacity-90 animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3">Meet {persona.name}</h3>
            <p className="text-stone-600 dark:text-stone-400 max-w-sm italic text-lg leading-relaxed">{persona.greeting || "Waiting for your first message..."}</p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isAnimating = lastAnimatedId === msg.id;

          if (msg.isScenario) {
            return (
              <div key={msg.id} className="flex flex-col items-center my-10 animate-in fade-in zoom-in-95 duration-700 max-w-2xl mx-auto">
                {msg.scenarioImage && (
                  <div className="w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-stone-700 mb-6 transform hover:scale-[1.02] transition-transform">
                    <img
                      src={(msg.scenarioImage.url.startsWith('blob:') && msg.scenarioImage.base64) ? msg.scenarioImage.base64 : msg.scenarioImage.url}
                      alt="Scenario"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="px-10 py-5 bg-stone-100/40 dark:bg-stone-800/40 backdrop-blur-sm rounded-[2.5rem] border border-stone-200/50 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 text-lg italic text-center leading-relaxed font-serif relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Stage Direction</span>
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[95%] md:max-w-[85%] lg:max-w-[75%] flex items-start gap-2 md:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 shadow-md border-2 border-white dark:border-stone-700 overflow-hidden transition-all ${isUser && userProfile.isAnonymous ? 'grayscale brightness-125 opacity-70' : ''} ${isUser ? userProfile.color : persona.color}`}>
                  <img src={isUser ? userProfile.avatar : persona.avatar} alt={isUser ? userProfile.name : persona.name} className="w-full h-full object-cover" />
                </div>
                <div className={`p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm text-stone-800 dark:text-stone-100 leading-relaxed text-base md:text-lg ${isUser ? 'bg-stone-800 dark:bg-stone-200 dark:text-stone-900 text-white rounded-tr-none shadow-stone-200 dark:shadow-none' : 'bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-tl-none shadow-sm'}`}>
                  {msg.attachment && renderAttachment(msg.attachment)}
                  {isAnimating ? (
                    <TypingText text={msg.text} onComplete={() => setLastAnimatedId(null)} />
                  ) : isUser ? (
                    msg.text
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full ${persona.color} overflow-hidden`}><img src={persona.avatar} alt="" /></div>
              <div className="bg-white/80 dark:bg-stone-800/80 p-5 rounded-[2rem] rounded-tl-none border border-white dark:border-stone-700 flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Input Overlay */}
      {showScenarioMode && (
        <div className="absolute inset-x-0 bottom-[100px] px-6 z-20 animate-in slide-in-from-bottom-8 duration-500">
          <div className="max-w-2xl mx-auto glass p-8 rounded-[3rem] border-amber-300 dark:border-amber-600 border-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative">
            <button onClick={() => setShowScenarioMode(false)} className="absolute top-6 right-6 p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors text-stone-400">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-600 dark:text-amber-400">
                <Theater size={24} />
              </div>
              <div>
                <h4 className="font-black text-xl text-stone-800 dark:text-stone-100">Scenario Director</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">Define the next moment in the story</p>
              </div>
            </div>

            <form onSubmit={handleScenarioSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300">The Event</label>
                <textarea
                  autoFocus
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  placeholder="What happens? (e.g. A storm breaks, a new guest arrives...)"
                  className="w-full bg-white/60 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 p-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 dark:focus:ring-amber-900/20 text-base shadow-inner resize-none min-h-[100px] text-stone-800 dark:text-stone-100"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300">Visual Atmosphere (Optional)</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => scenarioFileInputRef.current?.click()}
                    className="flex items-center gap-3 p-4 bg-white/60 dark:bg-stone-800/60 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl hover:border-amber-400 hover:bg-amber-50/30 transition-all text-left group"
                  >
                    <div className="p-2 bg-stone-100 dark:bg-stone-700 rounded-xl text-stone-400">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-stone-600 dark:text-stone-300 block">Upload Image</span>
                      <span className="text-[10px] text-stone-400">From local device</span>
                    </div>
                  </button>

                  <div className="p-4 bg-white/60 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-stone-100 dark:bg-stone-700 rounded-xl text-stone-400">
                      <LinkIcon size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="Paste URL..."
                      value={scenarioUrl}
                      onChange={(e) => setScenarioUrl(e.target.value)}
                      onBlur={handleScenarioUrlBlur}
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-stone-300 dark:placeholder:text-stone-600 text-stone-800 dark:text-stone-100"
                    />
                  </div>
                </div>

                {pendingScenarioImage && (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-stone-700 group">
                    <img src={pendingScenarioImage.url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPendingScenarioImage(null); setScenarioUrl(''); }}
                      className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!scenarioInput.trim() || isTyping}
                className="w-full py-4 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 rounded-[1.5rem] font-bold shadow-xl shadow-stone-200 dark:shadow-none hover:bg-stone-700 dark:hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Cast This Scenario <Zap size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Input Command Bar */}
      <div className="p-3 md:p-4 glass border-t border-white/20 dark:border-white/5 relative z-10 chat-input-container">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">

          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="mb-1 animate-in slide-in-from-bottom-2 duration-300 flex justify-center">
              <div className="relative inline-block group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-xl bg-white dark:bg-stone-800 flex items-center justify-center">
                  {pendingAttachment.type === 'image' && <img src={pendingAttachment.url} className="w-full h-full object-cover" alt="" />}
                  {pendingAttachment.type === 'video' && <FileVideo size={30} className="text-stone-400 animate-pulse" />}
                  {pendingAttachment.type === 'audio' && <FileAudio size={30} className="text-stone-400 animate-pulse" />}
                </div>
                <button
                  onClick={() => setPendingAttachment(null)}
                  className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end bg-white/60 dark:bg-stone-800/60 backdrop-blur-md border border-stone-200/50 dark:border-stone-700/50 p-1.5 pl-3 pr-1 rounded-[2rem] shadow-lg transition-all hover:shadow-xl focus-within:border-amber-500/30 focus-within:shadow-amber-500/10"
          >
            {/* Action Buttons (Left) */}
            <div className="flex items-center gap-0.5 pb-1 pr-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-stone-400 dark:text-stone-500 hover:text-amber-500 hover:bg-white/50 dark:hover:bg-stone-700/50 transition-all rounded-full"
                title="Attach Media"
              >
                <Paperclip size={19} className="hover:rotate-12 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => !isApiKeyMissing && setShowScenarioMode(!showScenarioMode)}
                disabled={isApiKeyMissing}
                className={`p-2.5 transition-all rounded-full ${isApiKeyMissing ? 'opacity-30 cursor-not-allowed' : showScenarioMode ? 'bg-amber-500 text-white shadow-md' : 'text-stone-400 dark:text-stone-500 hover:text-amber-600 hover:bg-white/50 dark:hover:bg-stone-700/50'}`}
                title={isApiKeyMissing ? "API Key required" : "Scenario Builder"}
              >
                <Theater size={19} />
              </button>
              <div className="w-px h-5 bg-stone-200/70 dark:bg-stone-700/70 mx-0.5 mb-1.5" />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isApiKeyMissing ? "Set an API key to begin..." : userProfile.isAnonymous ? "Whisper to the void..." : `Message ${persona.name}...`}
              disabled={isTyping || isApiKeyMissing}
              className={`flex-1 bg-transparent py-2.5 px-1 focus:outline-none text-stone-700 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none overflow-hidden max-h-[200px] text-base leading-relaxed ${isApiKeyMissing ? 'cursor-not-allowed italic' : ''}`}
            />

            {/* Send Button (Right) */}
            <div className="pb-0.5 pl-2">
              <button
                type="submit"
                disabled={(!input.trim() && !pendingAttachment) || isTyping || isApiKeyMissing}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${isApiKeyMissing ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-300 dark:text-stone-600 cursor-not-allowed' : input.trim() || pendingAttachment ? 'bg-amber-500 text-white shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95' : 'bg-stone-100 dark:bg-stone-700/50 text-stone-300 dark:text-stone-600'}`}
              >
                {isTyping ? (
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  </div>
                ) : (
                  <Send size={18} className={input.trim() || pendingAttachment ? 'translate-x-0.5' : ''} />
                )}
              </button>
            </div>
          </form>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-center h-3 animate-in fade-in duration-300">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                {persona.name} is reflecting...
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
