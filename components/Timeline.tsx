
import React from 'react';
import { Segment } from '../types';

interface TimelineProps {
  duration: number; // Total duration in seconds
  currentTime: number;
  segments: Segment[];
  onSeek: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ duration, currentTime, segments, onSeek }) => {
  
  const getPos = (time: number) => {
    if (duration === 0) return 0;
    return (time / duration) * 100;
  };

  const currentPos = getPos(currentTime);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  // Generate tick marks
  const ticks = Array.from({ length: 21 }).map((_, i) => i);

  return (
    <div className="h-full w-full bg-nothing-input p-5 flex flex-col relative select-none">
      
      {/* Header / Ruler */}
      <div className="flex items-end h-8 mb-1 relative border-b border-nothing-border">
          {ticks.map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                  <div className={`w-[1px] bg-nothing-grey/30 ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`}></div>
                  {i % 5 === 0 && (
                      <span className="text-[9px] font-dot text-nothing-black/60 absolute -bottom-5 font-bold tabular-nums">
                          {Math.floor((duration * (i/20)) / 60)}:{(Math.floor((duration * (i/20)) % 60)).toString().padStart(2, '0')}
                      </span>
                  )}
              </div>
          ))}
      </div>

      {/* Main Track Container */}
      <div 
        className="relative flex-1 rounded-lg overflow-hidden cursor-crosshair mt-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] bg-nothing-border border-t border-nothing-border/50"
        onClick={handleClick}
      >
        {/* Track Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, #000 20px)' 
        }}></div>

        {/* Center Guide Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-nothing-card/50 border-t border-dashed border-nothing-black/10"></div>

        {/* Segments - Physical Blocks */}
        {segments.map((seg) => {
          if (!seg.active) return null; 
          const left = getPos(seg.start);
          const width = getPos(seg.end) - left;
          
          return (
            <div
              key={seg.id}
              className="absolute top-2 bottom-2 bg-nothing-card z-10 rounded-[3px] group/segment border border-nothing-border/60 transition-colors"
              style={{ 
                  left: `${left}%`, 
                  width: `${width}%`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)' 
              }}
              title={seg.description}
            >
               {/* Top Highlight (Bevel) */}
               <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/50 rounded-t-[3px]"></div>
               
               {/* Label */}
               {width > 8 && (
                   <div className="absolute top-1/2 -translate-y-1/2 left-2 text-[8px] font-mono text-nothing-black/40 font-bold tracking-widest pointer-events-none truncate max-w-full">
                       {seg.description.toUpperCase()}
                   </div>
               )}

               {/* Grip Texture */}
               <div className="absolute right-1 top-1.5 bottom-1.5 w-[2px] border-l border-r border-nothing-black/10"></div>
            </div>
          );
        })}

        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-[1px] bg-nothing-red z-30 pointer-events-none transition-all duration-75 ease-linear mix-blend-normal"
          style={{ left: `${currentPos}%` }}
        >
           {/* Head */}
           <div className="absolute -top-1.5 -translate-x-1/2 text-nothing-red drop-shadow-sm">
               <div className="w-3 h-3 bg-nothing-red rotate-45 border-2 border-nothing-card rounded-[1px]"></div>
           </div>
           
           {/* Line Shadow */}
           <div className="absolute inset-0 bg-nothing-red shadow-[0_0_2px_rgba(215,25,32,0.5)]"></div>
           
           {/* Time Label Tag */}
           <div className="absolute -top-7 -translate-x-1/2 bg-nothing-black text-nothing-inverse px-1.5 py-0.5 rounded-[2px] text-[8px] font-mono shadow-md whitespace-nowrap z-40">
               {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}.<span className="text-nothing-grey">{Math.floor((currentTime % 1) * 10).toString()}</span>
               {/* Connector Arrow */}
               <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-nothing-black"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
