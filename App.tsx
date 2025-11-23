import React, { useState, useEffect } from 'react';
import { Plus, Globe2, BookOpen } from 'lucide-react';
import { WorldMap } from './components/WorldMap';
import { MemoryList } from './components/MemoryList';
import { AddMemoryModal } from './components/AddMemoryModal';
import { MemoryDetail } from './components/MemoryDetail';
import { Memory } from './types';
import { AnimatePresence } from 'framer-motion';

// Mock initial data if storage is empty (Chinese locations)
const INITIAL_DATA: Memory[] = [
  {
    id: '1',
    locationName: '北京故宫',
    coordinates: { lat: 39.9163, lng: 116.3972 },
    date: '2023-06-15',
    companions: ['爸爸', '妈妈'],
    description: '我们爬上了景山看故宫全景，红墙黄瓦真的太壮观了。还看到了宫猫！',
    funFact: '故宫里有9999间半房子，据说只比天上的宫殿少半间哦！',
    photos: ['https://picsum.photos/id/1018/800/600'],
    tags: ['历史', '北京', '古迹']
  },
  {
    id: '2',
    locationName: '上海外滩',
    coordinates: { lat: 31.2304, lng: 121.4737 },
    date: '2022-08-10',
    companions: ['奶奶'],
    description: '晚上的灯光太美了，东方明珠塔像个大火箭。我们还坐了轮渡过江。',
    funFact: '外滩被称为“万国建筑博览群”，这里有52幢风格各异的大楼。',
    photos: ['https://picsum.photos/id/1015/800/600'],
    tags: ['城市', '夜景', '摩天大楼']
  },
  {
    id: '3',
    locationName: '西安兵马俑',
    coordinates: { lat: 34.3841, lng: 109.2785 },
    date: '2024-01-20',
    companions: ['表弟'],
    description: '好多好多的泥人战士，每一个长得都不一样！他们都在保护秦始皇。',
    funFact: '兵马俑原本是彩色的，但是出土后遇到空气氧化，颜色才消失了。',
    photos: ['https://picsum.photos/id/1047/800/600'],
    tags: ['博物馆', '历史', '西安']
  }
];

export default function App() {
  const [memories, setMemories] = useState<Memory[]>(() => {
    const saved = localStorage.getItem('explorer_memories');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // Mobile toggle

  useEffect(() => {
    localStorage.setItem('explorer_memories', JSON.stringify(memories));
  }, [memories]);

  const handleSaveMemory = (newMemory: Omit<Memory, 'id'>) => {
    const memory: Memory = {
      ...newMemory,
      id: crypto.randomUUID(),
    };
    setMemories(prev => [memory, ...prev]);
    setSelectedMemoryId(memory.id); // Auto select new memory
  };

  const selectedMemory = memories.find(m => m.id === selectedMemoryId) || null;

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Sidebar (List & Controls) */}
      <aside className="w-full md:w-[400px] lg:w-[450px] bg-white border-r border-slate-800 flex flex-col z-20 shadow-xl md:shadow-none h-full order-2 md:order-1">
        <div className="p-6 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
                <Globe2 size={24} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">小小探险家</h1>
            </div>
            
            {/* Mobile Toggle */}
            <div className="flex md:hidden bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <BookOpen size={20} />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <Globe2 size={20} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            记录新旅程
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-4 scroll-smooth bg-slate-50 ${viewMode === 'map' && 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">旅行日志</h2>
            <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">{memories.length} 次旅行</span>
          </div>
          <MemoryList 
            memories={memories} 
            selectedId={selectedMemoryId}
            onSelect={setSelectedMemoryId}
          />
        </div>
      </aside>

      {/* Main Content (Map) */}
      <main className={`flex-1 relative bg-slate-900 h-full order-1 md:order-2 ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
        {/* Space Background Decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50" />
        
        <div className="absolute inset-0 md:inset-6">
          <WorldMap 
            memories={memories} 
            selectedMemoryId={selectedMemoryId}
            onSelectMemory={setSelectedMemoryId}
          />
        </div>
      </main>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedMemoryId && (
          <MemoryDetail 
            memory={selectedMemory} 
            onClose={() => setSelectedMemoryId(null)} 
          />
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AddMemoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveMemory} 
      />
    </div>
  );
}