
import React, { useState, useEffect, useRef } from 'react';
import { Persona } from '../types';
import { X, Sparkles, User, Palette, Heart, RefreshCw, Upload, Link as LinkIcon, FileText, BookOpen, Trash2 } from 'lucide-react';
import { COLORS, AVATAR_PRESETS } from '../constants';
import mammoth from 'mammoth';

interface PersonaModalProps {
  onClose: () => void;
  onSave: (persona: Persona) => void;
  editPersona?: Persona | null;
}

const PersonaModal: React.FC<PersonaModalProps> = ({ onClose, onSave, editPersona }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memoryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Persona, 'id'>>({
    name: '',
    role: '',
    personality: '',
    bio: '',
    interests: [],
    speakingStyle: '',
    greeting: '',
    avatar: AVATAR_PRESETS[0],
    color: COLORS[0],
    memories: ''
  });

  const [activeTab, setActiveTab] = useState<'basics' | 'depth' | 'memories' | 'look'>('basics');
  const [imageMode, setImageMode] = useState<'presets' | 'custom'>('presets');
  const [interestInput, setInterestInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (editPersona) {
      setFormData({
        name: editPersona.name,
        role: editPersona.role,
        personality: editPersona.personality,
        bio: editPersona.bio,
        interests: editPersona.interests || [],
        speakingStyle: editPersona.speakingStyle || '',
        greeting: editPersona.greeting,
        avatar: editPersona.avatar,
        color: editPersona.color,
        memories: editPersona.memories || ''
      });
      if (!AVATAR_PRESETS.includes(editPersona.avatar)) {
        setImageMode('custom');
        setUrlInput(editPersona.avatar.startsWith('data:') ? '' : editPersona.avatar);
      }
    }
  }, [editPersona]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.role) {
      onSave({
        ...formData,
        id: editPersona?.id || Date.now().toString()
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    let allText = formData.memories || '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = await file.text();
          allText += `\n--- Document: ${file.name} ---\n${text}\n`;
        } else if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          allText += `\n--- Document: ${file.name} ---\n${result.value}\n`;
        }
      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
    }

    setFormData({ ...formData, memories: allText.trim() });
    setIsProcessing(false);
    if (memoryInputRef.current) memoryInputRef.current.value = '';
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setFormData({ ...formData, avatar: urlInput.trim() });
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, interestInput.trim()] });
      setInterestInput('');
    }
  };

  const removeInterest = (val: string) => {
    setFormData({ ...formData, interests: formData.interests.filter(i => i !== val) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-stone-900/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="modal-container bg-white rounded-none md:rounded-[2.5rem] shadow-2xl w-full md:max-w-2xl overflow-hidden flex flex-col h-full md:h-[90vh] md:max-h-[850px] animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Sparkles className="text-amber-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">{editPersona ? 'Edit' : 'Create'} Persona</h2>
              <p className="text-sm text-stone-500">Craft a unique soul to chat with</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-stone-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 py-2 gap-2 border-b border-stone-50 bg-white sticky top-0 z-20 overflow-x-auto no-scrollbar">
          {[
            { id: 'basics', label: 'Identity', icon: User },
            { id: 'depth', label: 'Soul', icon: Heart },
            { id: 'memories', label: 'Memories', icon: BookOpen },
            { id: 'look', label: 'Look', icon: Palette }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-amber-500 text-stone-800' : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="persona-form" onSubmit={handleSubmit} className="space-y-6">

            {activeTab === 'basics' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Display Name</label>
                    <input
                      type="text" required placeholder="e.g. Professor Paws"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Role / Archetype</label>
                    <input
                      type="text" required placeholder="e.g. Grumpy Historian"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Biography</label>
                  <textarea
                    rows={3} placeholder="Tell their back story. Where are they from? What is their life like?"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-inner resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Greeting Message</label>
                  <input
                    type="text" placeholder="How do they say hello for the first time?"
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            {activeTab === 'depth' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Core Personality Traits</label>
                  <textarea
                    rows={2} placeholder="Sarcastic, bubbly, cynical, highly empathetic..."
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-inner resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Speaking Style</label>
                  <input
                    type="text" placeholder="e.g. Speaks in riddles, uses 90s slang, very formal and polite..."
                    value={formData.speakingStyle}
                    onChange={(e) => setFormData({ ...formData, speakingStyle: e.target.value })}
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-50 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Interests & Obsessions</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text" placeholder="Add an interest..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      className="flex-1 px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-50"
                    />
                    <button type="button" onClick={addInterest} className="px-5 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map(interest => (
                      <span key={interest} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-100">
                        {interest}
                        <X size={12} className="cursor-pointer hover:text-amber-900" onClick={() => removeInterest(interest)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'memories' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-stone-50 p-6 rounded-2xl border border-dashed border-stone-200 text-center">
                  <BookOpen size={32} className="mx-auto text-stone-300 mb-3" />
                  <h3 className="text-sm font-bold text-stone-700 mb-1">Upload Reference Documents</h3>
                  <p className="text-xs text-stone-500 mb-4">The persona will remember these facts during chat. Supports .txt and .docx</p>

                  <input
                    type="file"
                    ref={memoryInputRef}
                    multiple
                    accept=".txt,.docx"
                    onChange={handleMemoryUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => memoryInputRef.current?.click()}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${isProcessing ? 'bg-stone-100 text-stone-400' : 'bg-white border border-stone-200 text-stone-700 hover:border-amber-400'
                      }`}
                  >
                    {isProcessing ? 'Reading documents...' : 'Select Files'}
                    <FileText size={18} />
                  </button>
                </div>

                {formData.memories && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-sm font-bold text-stone-700">Accumulated Knowledge</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, memories: '' })}
                        className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Wipe All
                      </button>
                    </div>
                    <div className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl shadow-inner max-h-48 overflow-y-auto text-xs text-stone-600 font-mono leading-relaxed whitespace-pre-wrap">
                      {formData.memories}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'look' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-10">
                <div className="flex flex-col items-center">
                  <div className={`w-32 h-32 rounded-full mb-6 overflow-hidden border-4 border-white shadow-2xl transition-transform hover:scale-105 ${formData.color}`}>
                    <img src={formData.avatar} alt="Current Avatar" className="w-full h-full object-cover" />
                  </div>

                  <div className="w-full bg-stone-50 p-1 rounded-2xl flex mb-6">
                    <button
                      type="button"
                      onClick={() => setImageMode('presets')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${imageMode === 'presets' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('custom')}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${imageMode === 'custom' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}
                    >
                      Custom
                    </button>
                  </div>

                  {imageMode === 'presets' ? (
                    <div className="grid grid-cols-4 gap-4 w-full">
                      {AVATAR_PRESETS.map(url => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: url })}
                          className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 ${formData.avatar === url ? 'border-amber-500 shadow-lg shadow-amber-100' : 'border-stone-100'
                            }`}
                        >
                          <img src={url} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${Math.random()}` })}
                        className="aspect-square rounded-2xl overflow-hidden border-4 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 transition-colors"
                      >
                        <RefreshCw size={24} />
                        <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Roll</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 p-6 bg-white border-2 border-dashed border-stone-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
                        >
                          <div className="p-3 bg-stone-50 rounded-full group-hover:bg-amber-100 transition-colors">
                            <Upload size={24} className="text-stone-400 group-hover:text-amber-600" />
                          </div>
                          <span className="text-sm font-bold text-stone-600">Upload Photo</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </button>

                        <div className="flex flex-col items-center justify-center gap-2 p-6 bg-white border-2 border-stone-100 rounded-2xl">
                          <div className="p-3 bg-stone-50 rounded-full">
                            <LinkIcon size={24} className="text-stone-400" />
                          </div>
                          <span className="text-sm font-bold text-stone-600">Link from Web</span>
                          <div className="flex w-full gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="https://..."
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                              className="flex-1 min-w-0 px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-200"
                            />
                            <button
                              type="button"
                              onClick={handleUrlSubmit}
                              className="px-3 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-700"
                            >
                              Go
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-4 text-center">Theme Color</label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-full ${color} border-2 transition-all hover:scale-110 ${formData.color === color ? 'border-stone-800 scale-110 shadow-lg' : 'border-white'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-4 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 font-bold text-stone-500 hover:text-stone-800 transition-colors"
          >
            Wait, Go Back
          </button>
          <button
            type="submit"
            form="persona-form"
            className="px-10 py-4 bg-stone-800 text-white font-bold rounded-[1.5rem] hover:bg-stone-700 transition-all shadow-xl shadow-stone-200 active:scale-95 flex items-center gap-2"
          >
            {editPersona ? 'Update Character' : 'Manifest Soul'}
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaModal;
