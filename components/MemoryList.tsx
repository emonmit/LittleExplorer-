import React from 'react';
import { Memory } from '../types';
import { Calendar, Users, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryListProps {
  memories: Memory[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export const MemoryList: React.FC<MemoryListProps> = ({ memories, onSelect, selectedId }) => {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <MapPin size={48} className="mb-4 opacity-50" />
        <p>还没有旅行记录哦。</p>
        <p className="text-sm">点击 "记录新旅程" 开始吧！</p>
      </div>
    );
  }

  // Sort by date descending
  const sortedMemories = [...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 pb-20">
      <AnimatePresence>
        {sortedMemories.map((memory) => (
          <motion.div
            key={memory.id}
            layoutId={memory.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onSelect(memory.id)}
            className={`
              relative p-4 rounded-xl cursor-pointer transition-all duration-300 border
              ${selectedId === memory.id 
                ? 'bg-white border-blue-400 ring-2 ring-blue-100 shadow-lg' 
                : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
              }
            `}
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shadow-sm relative">
                  {memory.photos.length > 0 ? (
                    <img src={memory.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <MapPin size={24} />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold truncate ${selectedId === memory.id ? 'text-blue-600' : 'text-slate-800'}`}>
                    {memory.locationName}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    {new Date(memory.date).getFullYear()}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{memory.description}</p>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(memory.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {memory.companions.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span className="truncate max-w-[100px]">{memory.companions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};