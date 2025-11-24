
import React, { useState, useEffect, useRef } from 'react';
import { Send, Cpu, Sparkles, Command, Mic, Volume2, VolumeX } from 'lucide-react';
import { ChatMessage } from '../types';
import * as GeminiService from '../services/geminiService';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  onToggleTTS: (enabled: boolean) => void;
  ttsEnabled: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProcessing, onToggleTTS, ttsEnabled }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setInput("Transcribing audio...");
            try {
                const text = await GeminiService.transcribeMicAudio(base64Audio);
                setInput(text);
            } catch (error) {
                console.error(error);
                setInput("Error transcribing audio.");
            }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-[320px] bg-nothing-card m-4 ml-0 rounded-[2rem] flex flex-col h-[calc(100vh-2rem)] flex-shrink-0 z-30 overflow-hidden border border-nothing-border shadow-soft transition-all duration-300">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-nothing-border flex justify-between items-center bg-nothing-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-nothing-black rounded-full flex items-center justify-center text-nothing-inverse shadow-md">
                <Cpu size={14} />
             </div>
             <div>
                <h2 className="font-bold text-xs text-nothing-black tracking-wide">AI Assistant</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-dot text-nothing-grey uppercase tracking-wider">Online</span>
                </div>
            </div>
        </div>

        {/* TTS Toggle */}
        <button 
            onClick={() => onToggleTTS(!ttsEnabled)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors border border-transparent ${ttsEnabled ? 'bg-nothing-bg text-nothing-black border-nothing-black/5' : 'text-nothing-grey hover:bg-nothing-bg'}`}
            title="Text-to-Speech"
        >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-nothing-bg" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div className="w-14 h-14 rounded-2xl bg-nothing-card border border-nothing-border flex items-center justify-center mb-4 shadow-sm">
                 <Sparkles size={20} className="text-nothing-black" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-xs text-nothing-black mb-2">Editor Assistant</p>
            <p className="font-sans text-[10px] text-nothing-grey max-w-[180px] leading-relaxed">
              System ready. Awaiting voice or text commands for video manipulation.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="text-[8px] font-mono text-nothing-grey/70 uppercase tracking-widest px-1">
                {msg.role === 'user' ? 'User' : 'ChatCut'}
            </div>
            
            <div
              className={`max-w-[90%] p-3.5 text-xs font-sans leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-nothing-card border border-nothing-black text-nothing-black rounded-[1rem] rounded-tr-sm'
                  : 'bg-nothing-card text-nothing-black rounded-[1rem] rounded-tl-sm border border-nothing-border'
              }`}
            >
              {msg.text}
            </div>
            <div className="text-[8px] text-nothing-grey px-1 opacity-50">
                 {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex items-center gap-3 px-4 py-3 bg-nothing-card rounded-2xl border border-nothing-border w-fit shadow-sm">
             <div className="flex gap-1">
                <div className="w-1 h-1 bg-nothing-black rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-nothing-red rounded-full animate-bounce delay-75"></div>
                <div className="w-1 h-1 bg-nothing-black rounded-full animate-bounce delay-150"></div>
             </div>
             <span className="text-[9px] font-mono uppercase text-nothing-grey tracking-wider">Computing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 pt-2 bg-nothing-card border-t border-nothing-border">
        <div className="flex items-center gap-2">
            <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 border ${
                    isRecording 
                        ? 'bg-nothing-red border-nothing-red text-white scale-110 shadow-md' 
                        : 'bg-nothing-card border-nothing-border text-nothing-black hover:border-nothing-black'
                }`}
            >
                <Mic size={16} className={isRecording ? 'animate-pulse' : ''} />
            </button>

            <form onSubmit={handleSubmit} className="relative group flex-1">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isRecording ? "Listening..." : "Execute command..."}
                    className="w-full bg-nothing-input border border-transparent focus:bg-nothing-card focus:border-nothing-black text-nothing-black placeholder-nothing-grey rounded-full pl-5 pr-12 py-3 focus:outline-none transition-all text-xs font-mono"
                    disabled={isProcessing || isRecording}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-nothing-black hover:bg-nothing-black/90 text-nothing-inverse rounded-full disabled:opacity-0 disabled:scale-50 transition-all flex items-center justify-center shadow-md nothing-btn"
                >
                    <Send size={12} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
