
import React from 'react';
import { ChatSession } from '../types';
import { X, Clock, MessageSquare, Trash2, ChevronRight } from 'lucide-react';

interface HistoryModalProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onClose: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  sessions,
  activeSessionId,
  onClose,
  onSelectSession,
  onDeleteSession
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="modal-container bg-white rounded-none md:rounded-[2.5rem] shadow-2xl w-full md:max-w-lg overflow-hidden flex flex-col h-full md:h-[70vh] md:max-h-[600px] glass animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-800 rounded-xl text-white">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-800">Memory Lane</h2>
              <p className="text-xs text-stone-500">Revisit past conversations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <MessageSquare size={48} className="mb-4" />
              <p className="font-medium">No saved memories yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${activeSessionId === session.id
                      ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-100'
                      : 'bg-white border-stone-100 hover:border-amber-200 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-stone-800 truncate pr-8">
                        {session.title || 'Untitled Chat'}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-1 mb-3">
                      {session.messages[session.messages.length - 1]?.text || 'No messages yet...'}
                    </p>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                        {new Date(session.updatedAt).toLocaleDateString()} at {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronRight size={14} className="text-stone-300" />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
