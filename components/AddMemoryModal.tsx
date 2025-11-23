import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, ImagePlus, MapPin, Calendar, Users as UsersIcon } from 'lucide-react';
import { enrichMemory } from '../services/geminiService';
import { Memory, AIEnrichedData } from '../types';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memory: Omit<Memory, 'id'>) => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enriched Data State
  const [enrichedData, setEnrichedData] = useState<AIEnrichedData | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAIEnrichment = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await enrichMemory(inputText);
      if (data) {
        setEnrichedData(data);
        setStep('review');
      } else {
        setError("无法识别这个地方，请尝试描述得更具体一些（例如：'北京天安门'）。");
      }
    } catch (err) {
      setError("AI服务暂时不可用，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (enrichedData) {
      onSave({
        locationName: enrichedData.locationName,
        coordinates: enrichedData.coordinates,
        date: enrichedData.date || new Date().toISOString().split('T')[0],
        companions: enrichedData.companions || [],
        description: enrichedData.description,
        funFact: enrichedData.funFact,
        photos: photos.length > 0 ? photos : [`https://picsum.photos/800/600?random=${Date.now()}`],
        tags: enrichedData.tags
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setStep('input');
    setInputText('');
    setEnrichedData(null);
    setPhotos([]);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {step === 'input' ? '记录新旅程' : '确认信息'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {step === 'input' ? (
                <div className="space-y-4">
                  <p className="text-slate-600">去了哪里玩？和谁去的？发生了什么有趣的事？</p>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="例如：去年暑假我和爸爸妈妈去了北京故宫，房子好大，红色的墙很漂亮！"
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all resize-none outline-none text-slate-700"
                    autoFocus
                  />
                  
                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    onClick={handleAIEnrichment}
                    disabled={isLoading || !inputText.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        正在探索世界...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        AI 智能生成
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrichedData && (
                    <>
                       {/* Quick Preview */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                           <MapPin size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{enrichedData.locationName}</h3>
                          <p className="text-sm text-slate-500">{enrichedData.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400 uppercase">日期</label>
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Calendar size={16} className="text-slate-400"/>
                            <input 
                              type="date" 
                              value={enrichedData.date || ''} 
                              onChange={(e) => setEnrichedData({...enrichedData, date: e.target.value})}
                              className="bg-transparent outline-none w-full text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400 uppercase">同伴</label>
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <UsersIcon size={16} className="text-slate-400"/>
                            <input 
                              type="text" 
                              value={enrichedData.companions?.join(', ') || ''} 
                              onChange={(e) => setEnrichedData({...enrichedData, companions: e.target.value.split(', ')})}
                              className="bg-transparent outline-none w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fun Fact Card */}
                      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-yellow-100">
                          <Sparkles size={64} />
                        </div>
                        <h4 className="font-bold text-yellow-700 text-sm mb-1 relative z-10">你知道吗？</h4>
                        <p className="text-sm text-yellow-800 relative z-10 italic">"{enrichedData.funFact}"</p>
                      </div>

                      {/* Photos */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase">照片</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                           >
                              <ImagePlus size={24} />
                              <span className="text-[10px] mt-1">添加</span>
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                           
                           {photos.map((src, i) => (
                             <div key={i} className="shrink-0 w-20 h-20 rounded-lg overflow-hidden relative group">
                                <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setStep('input')}
                          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                        >
                          返回
                        </button>
                        <button 
                          onClick={handleSave}
                          className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors"
                        >
                          保存探险
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};