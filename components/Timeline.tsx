import React, { useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { Segment } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  segments: Segment[];
  onSeek: (time: number) => void;
  onUpdateSegment: (updatedSegment: Segment) => void;
}

const Timeline: React.FC<TimelineProps> = ({ duration, currentTime, segments, onSeek, onUpdateSegment }) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const getPos = (time: number) => (duration === 0 ? 0 : (time / duration) * 100);
  const getTime = (pos: number) => (pos / 100) * duration;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  const bindHandle = (segment: Segment, handle: 'start' | 'end') =>
    useDrag(({ down, movement: [mx] }) => {
      if (!timelineRef.current) return;
      const { width } = timelineRef.current.getBoundingClientRect();
      const delta = (mx / width) * duration;

      let newTime = handle === 'start' ? segment.start + delta : segment.end + delta;
      newTime = Math.max(0, Math.min(duration, newTime));

      const updatedSegment = { ...segment, [handle]: newTime };

      // Prevent start from being after end
      if (updatedSegment.start > updatedSegment.end) {
          [updatedSegment.start, updatedSegment.end] = [updatedSegment.end, updatedSegment.start];
      }

      onUpdateSegment(updatedSegment);
    });

  const ticks = Array.from({ length: 21 }).map((_, i) => i);

  return (
    <div className="h-full w-full bg-nothing-input p-5 flex flex-col relative select-none">
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

      <div ref={timelineRef} className="relative flex-1 rounded-lg overflow-hidden cursor-crosshair mt-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] bg-nothing-border border-t border-nothing-border/50" onClick={handleClick}>
        {segments.map((seg) => {
          if (!seg.active) return null;
          const left = getPos(seg.start);
          const width = getPos(seg.end) - left;

          return (
            <div
              key={seg.id}
              className="absolute top-2 bottom-2 bg-nothing-card z-10 rounded-[3px] group/segment border border-nothing-border/60 transition-colors"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={seg.description}
            >
              <div {...bindHandle(seg, 'start')()} className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize z-20" />
              <div {...bindHandle(seg, 'end')()} className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize z-20" />
            </div>
          );
        })}

        <div className="absolute top-0 bottom-0 w-[1px] bg-nothing-red z-30 pointer-events-none" style={{ left: `${getPos(currentTime)}%` }}>
          <div className="absolute -top-1.5 -translate-x-1/2 text-nothing-red drop-shadow-sm">
            <div className="w-3 h-3 bg-nothing-red rotate-45 border-2 border-nothing-card rounded-[1px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
