
import React from 'react';
import { AppSettings } from '../types';
import { X, Settings, Cpu, Keyboard, Trash2, Download, Info } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  onResetData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onSave, onResetData }) => {
  const [localModel, setLocalModel] = React.useState(settings.model);
  const [localApiKey, setLocalApiKey] = React.useState(settings.apiKey || '');

  const handleSave = () => {
    onSave({ ...settings, model: localModel, apiKey: localApiKey });
    onClose();
  };

  const shortcuts = [
    { keys: ['Alt', 'A'], desc: 'Focus chat input' },
    { keys: ['Alt', 'S'], desc: 'Focus persona list' },
    { keys: ['Alt', 'N'], desc: 'Manifest new persona' },
    { keys: ['Alt', 'P'], desc: 'Open Theater view' },
    { keys: ['Alt', 'C'], desc: 'Open Chamber view' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="modal-container bg-white dark:bg-stone-900 rounded-none md:rounded-[2.5rem] shadow-2xl w-full md:max-w-xl overflow-hidden flex flex-col h-full md:h-[85vh] md:max-h-[750px] animate-in zoom-in-95 duration-300 border border-white/20">

        {/* Header */}
        <div className="p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-stone-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-800 dark:bg-stone-700 rounded-xl text-white">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-white">Application Settings</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">Configure your sanctuary's core</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors text-stone-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-amber-500" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Gemini API Key</h3>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Paste your Gemini API key here..."
                className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border-2 border-stone-100 dark:border-stone-800 focus:border-amber-500 outline-none transition-all placeholder:text-stone-400 text-stone-800 dark:text-stone-100"
              />
              <p className="px-2 text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <Info size={12} />
                <span>Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">Google AI Studio</a>. Keys are stored only in your browser.</span>
              </p>
            </div>
          </section>

          {/* Model Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={18} className="text-amber-500" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Intelligence Model</h3>
            </div>
            <div className="space-y-3">
              {[
                { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', desc: 'Fastest, smartest, most capable for complex reasoning.' },
                { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Balanced performance for cozy interactions.' },
                { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', desc: 'Lightweight and efficient for simpler tasks.' }
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setLocalModel(model.id as any)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${localModel === model.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-lg'
                    : 'border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700'
                    }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200">{model.label}</span>
                    {localModel === model.id && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-glow" />}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{model.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard size={18} className="text-indigo-500" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Keyboard Shortcuts (Hotkeys)</h3>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-6 border border-stone-100 dark:border-white/5 space-y-3">
              {shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-stone-600 dark:text-stone-400">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => (
                      <kbd key={k} className="px-2 py-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md text-[10px] font-black shadow-sm dark:text-stone-200">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={18} className="text-rose-500" />
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Management</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onResetData}
                className="p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all text-sm font-bold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Reset Sanctuary
              </button>
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-stone-500 text-[10px] flex items-center gap-3">
                <Info size={16} />
                <span>API Keys are handled securely by the sanctuary environment.</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-black/20 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">Cancel</button>
          <button
            onClick={handleSave}
            className="px-10 py-4 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-2xl shadow-xl hover:shadow-stone-200 dark:hover:shadow-none active:scale-95 transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
