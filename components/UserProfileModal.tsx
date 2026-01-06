
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { X, User, Palette, Heart, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import { COLORS, AVATAR_PRESETS } from '../constants';

interface UserProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile, onClose, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<'identity' | 'look'>('identity');
  const [interestInput, setInterestInput] = useState('');
  const [linkInput, setLinkInput] = useState(profile.avatar.startsWith('http') ? profile.avatar : '');

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, interestInput.trim()] });
      setInterestInput('');
    }
  };

  const removeInterest = (val: string) => {
    setFormData({ ...formData, interests: formData.interests.filter(i => i !== val) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, avatar: base64 });
        setLinkInput(''); // Clear link input when file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="modal-container bg-white dark:bg-stone-900 rounded-none md:rounded-[2.5rem] shadow-2xl w-full md:max-w-xl overflow-hidden flex flex-col h-full md:h-[80vh] md:max-h-[700px] animate-in zoom-in-95 duration-300 border border-white/20 dark:border-white/5">

        <div className="p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-stone-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-800 dark:bg-stone-700 rounded-xl text-white">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-white">Your Profile</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">Tell your personas about yourself</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors text-stone-400 dark:text-stone-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex px-8 border-b border-stone-50 dark:border-white/5 bg-white dark:bg-stone-900">
          <button onClick={() => setActiveTab('identity')} className={`py-4 px-6 font-bold text-sm transition-all border-b-2 ${activeTab === 'identity' ? 'border-stone-800 dark:border-amber-500 text-stone-800 dark:text-amber-500' : 'border-transparent text-stone-400 dark:text-stone-600'}`}>
            Identity
          </button>
          <button onClick={() => setActiveTab('look')} className={`py-4 px-6 font-bold text-sm transition-all border-b-2 ${activeTab === 'look' ? 'border-stone-800 dark:border-amber-500 text-stone-800 dark:text-amber-500' : 'border-transparent text-stone-400 dark:text-stone-600'}`}>
            Presence
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'identity' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Your Name</label>
                <input
                  type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="What should they call you?"
                  className="w-full px-5 py-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Short Bio</label>
                <textarea
                  rows={2} value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="A bit about your life..."
                  className="w-full px-5 py-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none resize-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Your Vibe / Personality</label>
                <input
                  type="text" value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="e.g. Quiet, curious, coffee-lover..."
                  className="w-full px-5 py-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Interests</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text" value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                    placeholder="Add an interest..."
                    className="flex-1 px-5 py-3 bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 rounded-xl outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
                  />
                  <button type="button" onClick={addInterest} className="px-5 bg-stone-800 dark:bg-amber-500 text-white dark:text-stone-900 font-bold rounded-xl transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map(i => (
                    <span key={i} className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg text-xs font-bold flex items-center gap-1 border border-stone-200 dark:border-stone-700">
                      {i} <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => removeInterest(i)} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 flex flex-col items-center">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-stone-700 shadow-2xl ${formData.color}`}>
                <img src={formData.avatar} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-4 w-full">
                {AVATAR_PRESETS.slice(0, 4).map(url => (
                  <button key={url} onClick={() => {
                    setFormData({ ...formData, avatar: url });
                    setLinkInput(''); // Clear link input when preset is selected
                  }} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${formData.avatar === url ? 'border-stone-800 dark:border-amber-500 scale-105 shadow-md' : 'border-stone-100 dark:border-stone-800'}`}>
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                  <Upload size={20} />
                  <span className="text-[10px] mt-1 font-bold">Custom</span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-3 w-full">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full ${color} border-2 transition-all ${formData.color === color ? 'border-stone-800 dark:border-amber-500 scale-110 shadow-lg' : 'border-white dark:border-stone-700'}`}
                  />
                ))}
              </div>

              <div className="w-full pt-4 border-t border-stone-100 dark:border-white/5">
                <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Or manifest via link</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-500 transition-colors">
                    <LinkIcon size={18} />
                  </div>
                  <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value);
                      setFormData({ ...formData, avatar: e.target.value });
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-12 pr-5 py-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none text-stone-800 dark:text-stone-100 text-sm placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-black/20 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">Cancel</button>
          <button
            onClick={() => onSave(formData)}
            className="px-10 py-4 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-2xl shadow-xl hover:bg-stone-700 dark:hover:bg-white active:scale-95 transition-all flex items-center gap-2"
          >
            Save Profile <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
