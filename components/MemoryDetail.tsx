import React, { useEffect, useRef } from 'react';
import { Memory } from '../types';
import { X, Calendar, MapPin, Users, Tag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Declaration to avoid TypeScript errors since we are loading AMap from script tag
declare const AMap: any;

interface MemoryDetailProps {
  memory: Memory | null;
  onClose: () => void;
}

export const MemoryDetail: React.FC<MemoryDetailProps> = ({ memory, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Initialize AMap
  useEffect(() => {
    if (!memory || !mapContainerRef.current) return;

    // Check if AMap is loaded
    if (typeof AMap === 'undefined') {
      console.error("AMap not loaded. Please check your API Key configuration in index.html");
      return;
    }

    const initMap = () => {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new AMap.Map(mapContainerRef.current, {
          zoom: 13,
          center: [memory.coordinates.lng, memory.coordinates.lat], // AMap uses [lng, lat]
          viewMode: '2D',
          lang: 'zh_cn', // Force Chinese
        });
      } else {
        mapInstanceRef.current.setZoomAndCenter(13, [memory.coordinates.lng, memory.coordinates.lat]);
      }

      // Clear existing markers
      mapInstanceRef.current.clearMap();

      // Add simple marker
      const marker = new AMap.Marker({
        position: [memory.coordinates.lng, memory.coordinates.lat],
        title: memory.locationName,
      });
      mapInstanceRef.current.add(marker);
    };

    initMap();

    // Cleanup not strictly necessary for AMap instance reuse but good practice if completely unmounting
    return () => {
       // We keep the instance alive for performance if the component just hides
    };
  }, [memory]);

  if (!memory) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-40 overflow-y-auto border-l border-slate-100"
    >
      <div className="relative">
        {/* Hero Image */}
        <div className="h-64 w-full bg-slate-200 relative">
          {memory.photos.length > 0 && (
            <img src={memory.photos[0]} alt={memory.locationName} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/40 transition-colors z-10"
          >
            <X size={24} />
          </button>
          
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-3xl font-bold tracking-tight text-shadow-sm">{memory.locationName}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Stamps decoration */}
          <div className="absolute top-56 right-6 pointer-events-none opacity-20 stamp-animate z-0">
             <div className="border-4 border-red-800 rounded-full w-24 h-24 flex items-center justify-center text-red-800 font-bold rotate-12">
                <div className="text-center text-[10px] uppercase leading-tight">
                  打卡成功<br/><span className="text-lg">{new Date(memory.date).getFullYear()}</span>
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-slate-800 mb-2">旅行故事</h3>
            <p className="text-slate-600 leading-relaxed text-lg">{memory.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 text-slate-400 mb-2">
                 <Calendar size={18} />
                 <span className="text-xs font-bold uppercase tracking-wider">时间</span>
               </div>
               <p className="font-semibold text-slate-700">{new Date(memory.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 text-slate-400 mb-2">
                 <Users size={18} />
                 <span className="text-xs font-bold uppercase tracking-wider">玩伴</span>
               </div>
               <p className="font-semibold text-slate-700">
                 {memory.companions.length > 0 ? memory.companions.join(', ') : '独自冒险'}
               </p>
            </div>
          </div>

          {/* Location Map (AMap) */}
          <div>
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-lg font-bold text-slate-800">具体位置</h3>
               <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                 {memory.coordinates.lat.toFixed(4)}, {memory.coordinates.lng.toFixed(4)}
               </div>
            </div>
            <div className="h-48 w-full rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner relative bg-slate-100 z-0">
               {typeof AMap === 'undefined' ? (
                 <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50">
                    地图加载中或未配置 Key
                 </div>
               ) : (
                 <div ref={mapContainerRef} className="h-full w-full" />
               )}
            </div>
          </div>

          {/* Fun Fact */}
          {memory.funFact && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden">
               <div className="absolute -right-6 -top-6 text-yellow-100/50">
                 <Sparkles size={80} />
               </div>
               <div className="flex items-center gap-2 mb-2 text-orange-600 font-bold relative z-10">
                 <Sparkles size={20} />
                 <h3>你知道吗？</h3>
               </div>
               <p className="text-orange-900/80 italic relative z-10">{memory.funFact}</p>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {memory.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium flex items-center gap-1">
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>

          {/* Gallery Grid (If more photos exist) */}
          {memory.photos.length > 1 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">照片墙</h3>
              <div className="grid grid-cols-2 gap-2">
                 {memory.photos.map((photo, idx) => (
                   <img key={idx} src={photo} alt="Gallery" className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-slate-100" />
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};