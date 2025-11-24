
import React, { useEffect, useRef } from 'react';
import { TranscriptItem, Segment } from '../types';
import { Play, Trash2 } from 'lucide-react';

interface TranscriptViewProps {
  mode: 'source' | 'edit';
  transcript: TranscriptItem[];
  segments: Segment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ 
  mode, 
  transcript, 
  segments, 
  currentTime, 
  onSeek 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active item in source mode
  useEffect(() => {
    if (activeItemRef.current && mode === 'source') {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, mode]);

  // Helper to determine if a transcript item is currently visible/active in the timeline
  const isItemActive = (item: TranscriptItem) => {
    return currentTime >= item.start && currentTime < item.end;
  };

  // --- RENDER: SOURCE MODE (Continuous Text) ---
  if (mode === 'source') {
    return (
      <div className="h-full overflow-y-auto p-6 bg-nothing-bg/30 relative" ref={scrollRef}>
        <div className="space-y-6">
           {/* Mock Speaker Header - In a real app, we'd group by speaker */}
           <div className="flex flex-col gap-1">
             <span className="text-nothing-red font-bold text-xs uppercase tracking-wider font-mono">Speaker 1</span>
             <div className="text-sm font-sans leading-relaxed text-nothing-black/80 space-y-1">
                {transcript.map((item) => {
                   const isActive = isItemActive(item);
                   return (
                     <span 
                       key={item.id}
                       ref={isActive ? activeItemRef : null}
                       onClick={() => onSeek(item.start)}
                       className={`cursor-pointer hover:bg-nothing-black/5 rounded px-0.5 transition-colors duration-200 ${
                         isActive 
                           ? 'bg-nothing-red/10 text-nothing-red font-medium decoration-nothing-red decoration-2' 
                           : ''
                       }`}
                     >
                       {item.text}{' '}
                     </span>
                   );
                })}
             </div>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: EDIT MODE (Card List of Active Segments) ---
  const activeTranscriptItems = transcript.filter(item => {
     return segments.some(seg => seg.active && item.start >= seg.start && item.end <= seg.end);
  });

  const cards: TranscriptItem[][] = [];
  let currentCard: TranscriptItem[] = [];
  
  activeTranscriptItems.forEach((item, index) => {
      const prev = activeTranscriptItems[index - 1];
      if (prev && (item.start - prev.end > 2.0)) {
          if (currentCard.length > 0) cards.push(currentCard);
          currentCard = [item];
      } else {
          currentCard.push(item);
      }
  });
  if (currentCard.length > 0) cards.push(currentCard);

  return (
    <div className="h-full overflow-y-auto p-4 bg-nothing-input space-y-3" ref={scrollRef}>
       {cards.length === 0 ? (
           <div className="h-full flex items-center justify-center text-nothing-grey text-xs font-mono uppercase">
               No content in edit
           </div>
       ) : (
           cards.map((cardItems, idx) => {
               const startTime = cardItems[0].start;
               const isPlayingCard = currentTime >= cardItems[0].start && currentTime <= cardItems[cardItems.length-1].end;
               
               return (
                   <div 
                     key={idx}
                     onClick={() => onSeek(startTime)}
                     className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                        isPlayingCard 
                            ? 'bg-nothing-card border-nothing-red/50 ring-1 ring-nothing-red/20 shadow-sm' 
                            : 'bg-nothing-card border-nothing-border hover:border-nothing-black/20'
                     }`}
                   >
                       <div className="flex items-center justify-between mb-2">
                           <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isPlayingCard ? 'text-nothing-red' : 'text-nothing-red/70'}`}>
                               Speaker 1
                           </span>
                           <span className="text-[9px] font-mono text-nothing-grey">
                               {Math.floor(startTime / 60)}:{Math.floor(startTime % 60).toString().padStart(2, '0')}
                           </span>
                       </div>
                       
                       <p className={`text-xs leading-relaxed ${isPlayingCard ? 'text-nothing-black' : 'text-nothing-black/70'}`}>
                           {cardItems.map(i => i.text).join(' ')}
                       </p>

                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-nothing-bg rounded-full text-nothing-grey hover:text-nothing-red transition-colors" title="Remove from edit">
                                <Trash2 size={12} />
                            </button>
                       </div>
                   </div>
               );
           })
       )}
    </div>
  );
};

export default TranscriptView;
