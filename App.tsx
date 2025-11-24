
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import Timeline from './components/Timeline';
import TranscriptView from './components/TranscriptView';
import { Upload, Video, Play, Pause, AlertTriangle, Download, Loader2, FileText, Eye, AlertCircle, Pen, X, Check } from 'lucide-react';
import { Segment, TranscriptItem, ChatMessage, AnalysisStatus, Project } from './types';
import * as GeminiService from './services/geminiService';
import { extractAudioAsBase64 } from './services/audioUtils';

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Untitled Project', date: 'Just now', duration: '00:00' },
  { id: '2', name: 'Tokyo Vlog_Final', date: '2d ago', duration: '12:45' },
];

type ViewMode = 'video' | 'transcript';

const App: React.FC = () => {
  // App Logic State
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('1');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // View States for Layout
  const [leftView, setLeftView] = useState<ViewMode>('video');
  const [rightView, setRightView] = useState<ViewMode>('video');

  // Media State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Editor State
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [visualDescription, setVisualDescription] = useState<string>("");
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeUpdateInterval = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyError(true);
    }
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Theme Toggle Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- PLAYBACK ENGINE ---
  const checkPlaybackRules = () => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Sync Result Video if it exists and is visible
    if (resultVideoRef.current && rightView === 'video') {
       if (Math.abs(resultVideoRef.current.currentTime - time) > 0.1) {
          resultVideoRef.current.currentTime = time;
       }
       if (isPlaying && resultVideoRef.current.paused) resultVideoRef.current.play();
       if (!isPlaying && !resultVideoRef.current.paused) resultVideoRef.current.pause();
    }

    if (segments.length > 0) {
      const activeSeg = segments.find(s => s.active && time >= s.start && time < s.end);
      
      if (!activeSeg) {
        const nextSeg = segments.find(s => s.active && s.start > time);
        if (nextSeg) {
          videoRef.current.currentTime = nextSeg.start;
        } else {
          if (!videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
            setCurrentTime(duration);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timeUpdateInterval.current = window.setInterval(checkPlaybackRules, 50);
    } else {
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    }
    return () => {
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    };
  }, [isPlaying, segments, rightView]); 

  // --- PROJECT MANAGEMENT ---
  const resetEditor = () => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoSrc(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setTranscript([]);
    setSegments([]);
    setAnalysisStatus('idle');
    setMessages([]);
    setVisualDescription("");
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNewProject = () => {
    if (videoSrc && !confirm("Start a new project? Unsaved progress will be lost.")) return;
    resetEditor();
    const newId = Date.now().toString();
    setProjects([{ id: newId, name: 'Untitled Project', date: 'Just now', duration: '00:00' }, ...projects]);
    setActiveProjectId(newId);
  };

  const handleDeleteProject = (id: string) => {
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeProjectId === id) {
        if (newProjects.length > 0) {
            setActiveProjectId(newProjects[0].id);
            resetEditor();
        } else {
            handleNewProject();
        }
    }
  };

  const handleSelectProject = (id: string) => {
    if (id === activeProjectId) return;
    if (videoSrc && !confirm("Switch project? Unsaved progress will be lost.")) return;
    resetEditor();
    setActiveProjectId(id);
  };

  const handleUpdateProjectName = (name: string) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, name } : p));
  };

  // --- MEDIA HANDLING ---
  const captureKeyframes = async (videoEl: HTMLVideoElement): Promise<string[]> => {
    return new Promise((resolve) => {
        const frames: string[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const times = [0, videoEl.duration * 0.25, videoEl.duration * 0.5, videoEl.duration * 0.75];
        let currentIdx = 0;
        
        const capture = () => {
            if (currentIdx >= times.length) {
                videoEl.currentTime = 0;
                resolve(frames);
                return;
            }
            videoEl.currentTime = times[currentIdx];
            const onSeek = () => {
                videoEl.removeEventListener('seeked', onSeek);
                canvas.width = videoEl.videoWidth / 4;
                canvas.height = videoEl.videoHeight / 4;
                ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                frames.push(dataUrl.split(',')[1]);
                currentIdx++;
                capture();
            };
            videoEl.addEventListener('seeked', onSeek);
        };
        capture();
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSegments([]);
      setTranscript([]);
      setIsPlaying(false);
      setCurrentTime(0);
      setVisualDescription("");
      setAnalysisStatus('extracting_audio');
      
      const newName = file.name.split('.')[0];
      handleUpdateProjectName(newName);
      
      setMessages([{
        id: 'init',
        role: 'model',
        text: `Analyzing "${file.name}"...`,
        timestamp: new Date()
      }]);

      try {
        if (file.size > 50 * 1024 * 1024) {
            alert("File too large. Please use <50MB.");
            setAnalysisStatus('error');
            return;
        }

        const audioBase64 = await extractAudioAsBase64(file);
        setAnalysisStatus('transcribing');
        
        const transcriptPromise = GeminiService.generateTranscript(audioBase64);

        let visualPromise = Promise.resolve("Visual analysis skipped");
        if (videoRef.current) {
             await new Promise(r => setTimeout(r, 1000));
             const frames = await captureKeyframes(videoRef.current);
             visualPromise = GeminiService.analyzeVisualContent(frames);
        }

        const [generatedTranscript, visualDesc] = await Promise.all([transcriptPromise, visualPromise]);

        setTranscript(generatedTranscript);
        setVisualDescription(visualDesc);
        setAnalysisStatus('ready');

        setSegments([{
            id: 'initial',
            start: 0,
            end: generatedTranscript[generatedTranscript.length-1]?.end || videoRef.current?.duration || 0,
            description: 'Full Video',
            active: true
        }]);

        const introMsg = `I've analyzed the video content. \n\n👀 **Visuals:** ${visualDesc.slice(0, 100)}... \n\nI'm ready to edit based on the transcript.`;
        setMessages(prev => [...prev, {
            id: 'ready',
            role: 'model',
            text: introMsg,
            timestamp: new Date()
        }]);

        if (ttsEnabled) {
            playTTS("Video analysis complete.");
        }

      } catch (err) {
        console.error(err);
        setAnalysisStatus('error');
        setMessages(prev => [...prev, {
            id: 'error',
            role: 'model',
            text: "Error during analysis. Please check your API key.",
            timestamp: new Date()
        }]);
      }
    }
  };

  const playTTS = async (text: string) => {
      const audioBuffer = await GeminiService.generateSpeech(text);
      if (audioBuffer && audioContextRef.current) {
          const ctx = audioContextRef.current;
          try {
            const buffer = await ctx.decodeAudioData(audioBuffer);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          } catch (e) { console.error(e); }
      }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (segments.length === 1 && segments[0].id === 'initial') {
         setSegments([{...segments[0], end: videoRef.current.duration}]);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      checkPlaybackRules();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!videoSrc) return;
    if (analysisStatus !== 'ready') return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const result = await GeminiService.processVideoEdit(transcript, segments, text, visualDescription);
      
      if (result.editedSegments && result.editedSegments.length > 0) {
        setSegments(result.editedSegments);
        const firstActive = result.editedSegments.find(s => s.active);
        if (firstActive && videoRef.current) {
             videoRef.current.currentTime = firstActive.start;
             setCurrentTime(firstActive.start);
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.reply,
        timestamp: new Date()
      }]);
      
      if (ttsEnabled) playTTS(result.reply);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error processing request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
     setIsExporting(true);
     setTimeout(() => {
         setIsExporting(false);
         alert("Export functionality would generate an EDL or render video here.");
     }, 1000);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans relative bg-nothing-bg text-nothing-black transition-colors duration-300">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onOpenPreferences={() => setShowPreferences(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10 pt-4">
        
        {/* Header Toolbar */}
        <div className="h-16 flex items-center justify-between px-6 shrink-0 mb-3 relative">
          
          {/* Left: Import */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-nothing-card text-nothing-black hover:bg-nothing-black hover:text-nothing-inverse border border-nothing-border hover:border-nothing-black px-5 py-2.5 rounded-[1.2rem] flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide transition-all shadow-sm nothing-btn"
            >
              <Upload size={14} />
              Import Video
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
          </div>

          {/* Center: Project Name */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[300px] text-center group">
              <div className="relative">
                <input 
                  value={activeProject.name} 
                  onChange={(e) => handleUpdateProjectName(e.target.value)}
                  className="bg-transparent text-center font-dot text-lg text-nothing-black focus:outline-none placeholder-nothing-grey/30 w-full border-b-2 border-transparent hover:border-nothing-black/10 focus:border-nothing-red transition-colors py-1"
                  placeholder="Untitled Project"
                />
                <Pen size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-nothing-grey opacity-0 group-hover:opacity-50" />
              </div>
          </div>
          
          {/* Right: Export */}
          <div className="flex items-center gap-4">
             {apiKeyError && (
                 <span className="flex items-center gap-2 text-nothing-red text-[10px] px-3 py-1.5 bg-nothing-card rounded-full border border-nothing-red font-bold uppercase">
                    <AlertTriangle size={12}/> Key Missing
                 </span>
             )}
             <button 
                onClick={handleExport}
                disabled={!videoSrc || isExporting}
                className="bg-nothing-red text-white hover:bg-nothing-black hover:text-nothing-inverse px-5 py-2.5 rounded-[1.2rem] flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 nothing-btn shadow-float border border-transparent"
             >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export
             </button>
          </div>
        </div>

        {/* --- DUAL VIEW WORKSPACE --- */}
        <div className="flex-1 grid grid-cols-2 gap-4 px-4 pb-4 min-h-0">
          
          {/* LEFT: MEDIA VIEWER (Source) */}
          <div className="nothing-card p-0 flex flex-col min-h-0 relative overflow-hidden group border-nothing-border shadow-soft bg-nothing-card">
             {/* Header with Switcher */}
             <div className="h-14 border-b border-nothing-border flex items-center justify-between px-4 bg-nothing-surface">
                <span className="text-[10px] font-bold font-mono text-nothing-grey uppercase tracking-widest">Media Viewer</span>
                <div className="flex bg-nothing-bg/80 p-1 rounded-lg border border-nothing-border/50">
                    <button 
                      onClick={() => setLeftView('video')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${leftView === 'video' ? 'bg-nothing-card shadow-sm text-nothing-black ring-1 ring-nothing-black/10' : 'text-nothing-grey hover:text-nothing-black'}`}
                    >
                      <Video size={10} /> Video
                    </button>
                    <button 
                      onClick={() => setLeftView('transcript')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${leftView === 'transcript' ? 'bg-nothing-card shadow-sm text-nothing-black ring-1 ring-nothing-black/10' : 'text-nothing-grey hover:text-nothing-black'}`}
                    >
                      <FileText size={10} /> Transcript
                    </button>
                </div>
             </div>
            
            <div className="flex-1 relative bg-black overflow-hidden">
               {/* Video Layer */}
               <div className={`absolute inset-0 flex items-center justify-center bg-black ${leftView === 'video' ? 'z-10' : 'z-0'}`}>
                  {!videoSrc ? (
                     <div className="text-nothing-grey text-xs font-mono">NO MEDIA LOADED</div>
                  ) : (
                    <video 
                      ref={videoRef}
                      src={videoSrc}
                      className="max-h-full max-w-full"
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      crossOrigin="anonymous"
                    />
                  )}
               </div>
               
               {/* Transcript Layer */}
               {leftView === 'transcript' && (
                 <div className="absolute inset-0 z-20 bg-nothing-card">
                    {transcript.length > 0 ? (
                      <TranscriptView 
                        mode="source" 
                        transcript={transcript} 
                        segments={segments} 
                        currentTime={currentTime} 
                        onSeek={handleSeek} 
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-nothing-grey text-xs font-mono uppercase">NO TRANSCRIPT DATA</div>
                    )}
                 </div>
               )}
            </div>
          </div>

          {/* RIGHT: EDIT VIEWER (Result) */}
          <div className="nothing-card p-0 flex flex-col min-h-0 relative overflow-hidden group border-nothing-border shadow-soft bg-nothing-card">
             {/* Header with Switcher */}
             <div className="h-14 border-b border-nothing-border flex items-center justify-between px-4 bg-nothing-surface">
                <span className="text-[10px] font-bold font-mono text-nothing-grey uppercase tracking-widest">Edit Viewer</span>
                <div className="flex bg-nothing-bg/80 p-1 rounded-lg border border-nothing-border/50">
                    <button 
                      onClick={() => setRightView('video')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${rightView === 'video' ? 'bg-nothing-card shadow-sm text-nothing-black ring-1 ring-nothing-black/10' : 'text-nothing-grey hover:text-nothing-black'}`}
                    >
                      <Video size={10} /> Video
                    </button>
                    <button 
                      onClick={() => setRightView('transcript')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${rightView === 'transcript' ? 'bg-nothing-card shadow-sm text-nothing-black ring-1 ring-nothing-black/10' : 'text-nothing-grey hover:text-nothing-black'}`}
                    >
                      <FileText size={10} /> Transcript
                    </button>
                </div>
             </div>

            <div className="flex-1 relative bg-black overflow-hidden">
                 <div className={`absolute inset-0 flex items-center justify-center bg-black ${rightView === 'video' ? 'z-10' : 'z-0'}`}>
                     {videoSrc ? (
                         <video 
                             ref={resultVideoRef}
                             src={videoSrc}
                             className="max-h-full max-w-full"
                             muted 
                         />
                     ) : (
                         <div className="text-nothing-grey text-xs font-mono">NO OUTPUT</div>
                     )}
                     
                     {rightView === 'video' && videoSrc && (
                        <div className="absolute top-4 right-4 bg-nothing-red text-white text-[9px] font-bold px-2 py-1 rounded shadow-md uppercase font-mono tracking-wide">
                           Preview
                        </div>
                     )}
                 </div>

                 {rightView === 'transcript' && (
                     <div className="absolute inset-0 z-20 bg-nothing-card">
                        {segments.length > 0 ? (
                           <TranscriptView 
                             mode="edit" 
                             transcript={transcript} 
                             segments={segments} 
                             currentTime={currentTime} 
                             onSeek={handleSeek} 
                           />
                        ) : (
                           <div className="h-full flex items-center justify-center text-nothing-grey text-xs font-mono uppercase">NO EDITS YET</div>
                        )}
                     </div>
                 )}
            </div>
          </div>
        </div>

        {/* Timeline & Controls */}
        <div className="h-56 shrink-0 bg-nothing-card m-4 mt-0 mb-4 rounded-[2rem] flex flex-col z-20 relative shadow-soft overflow-hidden border border-nothing-border transition-colors duration-300">
            <div className="h-12 border-b border-nothing-border flex items-center justify-between px-6 bg-nothing-surface sticky top-0 z-20">
                <div className="w-1/3 flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase text-nothing-grey tracking-widest">Sequence</span>
                </div>
                
                <div className="w-1/3 flex justify-center">
                  <button 
                    onClick={togglePlay}
                    disabled={!videoSrc}
                    className="w-8 h-8 rounded-full bg-nothing-black hover:bg-nothing-red text-nothing-inverse flex items-center justify-center transition-all shadow-lg disabled:opacity-50 border border-transparent"
                  >
                      {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                  </button>
                </div>
                
                <div className="w-1/3 flex justify-end">
                  <div className="font-mono text-[9px] font-medium text-nothing-black bg-nothing-card px-2 py-1 rounded border border-nothing-border tabular-nums">
                      {new Date(currentTime * 1000).toISOString().substr(14, 5)} <span className="text-nothing-grey">/</span> {new Date(duration * 1000).toISOString().substr(14, 5)}
                  </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-nothing-input">
                <Timeline 
                    duration={duration} 
                    currentTime={currentTime} 
                    segments={segments} 
                    onSeek={handleSeek} 
                />
            </div>
        </div>
      </div>

      <ChatPanel 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isProcessing={isProcessing} 
        onToggleTTS={setTtsEnabled}
        ttsEnabled={ttsEnabled}
      />

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-nothing-card w-[500px] p-8 rounded-[2rem] shadow-2xl border border-nothing-border relative">
              <button 
                onClick={() => setShowPreferences(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-nothing-bg rounded-full transition-colors"
              >
                  <X size={20} className="text-nothing-black" />
              </button>
              <h2 className="text-2xl font-dot mb-8 text-nothing-black">Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-nothing-border/50">
                    <div>
                        <div className="font-bold text-sm text-nothing-black">Dark Mode</div>
                        <div className="text-xs text-nothing-grey mt-1">Experimental high contrast theme</div>
                    </div>
                    {/* Dark Mode Toggle */}
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${darkMode ? 'bg-nothing-black' : 'bg-nothing-border'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-nothing-border/50">
                    <div>
                        <div className="font-bold text-sm text-nothing-black">Auto-Transcribe</div>
                        <div className="text-xs text-nothing-grey mt-1">Transcribe media upon import</div>
                    </div>
                    <div className="w-12 h-6 bg-nothing-black rounded-full p-1 cursor-pointer relative justify-end flex">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-nothing-card w-[400px] p-8 rounded-[2rem] shadow-2xl border border-nothing-border relative text-center">
              <button 
                onClick={() => setShowProfile(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-nothing-bg rounded-full transition-colors"
              >
                   <X size={20} className="text-nothing-black" />
              </button>
              
              <div className="w-24 h-24 bg-nothing-red rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl font-mono font-bold shadow-float ring-4 ring-nothing-card">
                  US
              </div>
              <h2 className="text-2xl font-bold text-nothing-black mb-1">User.01</h2>
              <div className="text-xs font-mono text-nothing-grey uppercase tracking-widest mb-6">Pro Plan • Active</div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-nothing-bg p-4 rounded-xl">
                      <div className="text-xl font-dot text-nothing-black">24</div>
                      <div className="text-[10px] uppercase text-nothing-grey font-bold">Projects</div>
                  </div>
                  <div className="bg-nothing-bg p-4 rounded-xl">
                      <div className="text-xl font-dot text-nothing-black">12h</div>
                      <div className="text-[10px] uppercase text-nothing-grey font-bold">Saved</div>
                  </div>
              </div>
              
              <button className="w-full py-3 bg-nothing-black text-nothing-inverse rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg">
                  Manage Subscription
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
