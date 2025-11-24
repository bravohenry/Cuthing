
import React, { useState } from 'react';
import { Plus, Settings, Disc, Trash2, File, User, ChevronRight, Film, FileJson } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onOpenPreferences: () => void;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onNewProject, 
  onDeleteProject,
  onOpenPreferences,
  onOpenProfile
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
        onDeleteProject(id);
    }
  };

  return (
    <div 
      className={`h-full flex flex-col flex-shrink-0 z-30 relative bg-nothing-sidebar border-r border-nothing-border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-width ${
        isCollapsed ? 'w-[72px] px-2' : 'w-[240px] px-4'
      }`}
    >
      {/* Floating Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-nothing-card border border-nothing-border rounded-full flex items-center justify-center hover:scale-110 transition-transform z-50 shadow-sm group"
      >
         <div className="w-0.5 h-3 bg-nothing-black/20 group-hover:bg-nothing-black transition-colors"></div>
      </button>

      {/* Brand Section */}
      <div className="h-24 flex items-end pb-6 shrink-0 overflow-hidden relative pl-2">
        <div className={`transition-all duration-500 absolute left-0 bottom-6 whitespace-nowrap ${
             isCollapsed ? 'opacity-0 translate-x-[-10px]' : 'opacity-100 translate-x-2'
        }`}>
            <h1 className="font-dot text-3xl text-nothing-black leading-none tracking-tight">Cuthing</h1>
        </div>
        
        {/* Collapsed Fallback */}
        <div className={`w-full flex justify-center items-end pb-1 transition-all duration-500 ${
            isCollapsed ? 'opacity-100 delay-200' : 'opacity-0 pointer-events-none'
        }`}>
             <span className="font-dot text-xl text-nothing-black">C.</span>
        </div>
      </div>

      {/* Primary Action */}
      <div className="mb-6 shrink-0 flex justify-center">
        <button 
          onClick={onNewProject}
          className={`group bg-nothing-black text-nothing-inverse hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-lg ${
               isCollapsed 
                 ? 'w-12 h-12 rounded-full' 
                 : 'w-full h-12 rounded-full'
          }`}
          title="New Project"
        >
          <Plus size={20} strokeWidth={2.5} className="text-nothing-inverse" />
          <span className={`font-medium text-sm tracking-wide whitespace-nowrap transition-all duration-500 text-nothing-inverse ${
              isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100 ml-2'
          }`}>
              NEW PROJECT
          </span>
        </button>
      </div>
      
      {/* Project List */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide">
        {!isCollapsed && (
            <div className="px-2 mb-2 mt-2">
                <span className="text-[10px] font-bold text-nothing-grey/60 uppercase tracking-widest font-mono">Recent</span>
            </div>
        )}

        {projects.map((project) => {
          const isActive = project.id === activeProjectId;
          return (
            <div key={project.id} className="flex flex-col mb-1">
                {/* Project Card */}
                <div 
                  onClick={() => onSelectProject(project.id)}
                  className={`group relative flex items-center h-14 px-2 rounded-xl cursor-pointer transition-all duration-200 z-10 ${
                    isActive 
                      ? 'bg-nothing-card border border-nothing-border shadow-sm' 
                      : 'hover:bg-nothing-card/40 border border-transparent'
                  }`}
                >
                   {/* Icon Container */}
                   <div className={`w-10 flex items-center justify-center shrink-0 ${isCollapsed ? 'w-full' : ''}`}>
                       <div className={`transition-all duration-200 ${isActive ? 'text-nothing-black' : 'text-nothing-grey'}`}>
                          {isActive ? (
                              <div className="relative">
                                  <Disc size={18} strokeWidth={2.5} />
                                  <div className="absolute inset-0 bg-nothing-red rounded-full opacity-0 animate-ping"></div>
                              </div>
                          ) : (
                              <File size={18} strokeWidth={1.5} />
                          )}
                       </div>
                   </div>
                   
                   {/* Text Label */}
                   <div className={`flex-1 min-w-0 transition-all duration-500 overflow-hidden whitespace-nowrap flex flex-col justify-center ml-1 text-left ${
                       isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'
                   }`}>
                        <span className={`text-xs font-semibold truncate ${isActive ? 'text-nothing-black' : 'text-nothing-grey'}`}>
                          {project.name}
                        </span>
                        <span className="text-[10px] text-nothing-grey/50 font-mono">
                           {project.date}
                        </span>
                   </div>
                   
                   {/* Hover Delete */}
                   {!isCollapsed && (
                     <button 
                        onClick={(e) => handleDelete(e, project.id)}
                        className="w-8 h-8 flex items-center justify-center text-nothing-grey hover:text-nothing-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                         <Trash2 size={14} />
                     </button>
                   )}
                </div>

                {/* Expanded Sub-files */}
                {isActive && !isCollapsed && (
                    <div className="ml-5 pl-4 border-l-2 border-nothing-border/50 my-1 space-y-0.5 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 px-2 py-2 text-[10px] text-nothing-black/70 hover:bg-nothing-card/60 rounded-md cursor-pointer transition-colors group/file">
                            <Film size={12} className="text-nothing-red group-hover/file:scale-110 transition-transform" />
                            <span className="truncate font-medium">Source_Media.mp4</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-2 text-[10px] text-nothing-black/70 hover:bg-nothing-card/60 rounded-md cursor-pointer transition-colors group/file">
                            <FileJson size={12} className="text-nothing-grey group-hover/file:scale-110 transition-transform" />
                            <span className="truncate font-medium">Edit_Sequence_v1</span>
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 pb-6 flex flex-col gap-2 border-t border-nothing-border/50 px-2">
         <button 
           onClick={onOpenPreferences}
           className={`h-10 w-full flex items-center rounded-lg hover:bg-nothing-black/5 transition-colors group ${isCollapsed ? 'justify-center' : 'px-2'}`}
           title="Settings"
         >
             <div className={`flex items-center justify-center shrink-0 text-nothing-black ${isCollapsed ? '' : 'mr-3'}`}>
                <Settings size={18} strokeWidth={1.5} />
             </div>
             <span className={`text-xs font-bold text-nothing-black whitespace-nowrap transition-all duration-500 overflow-hidden uppercase tracking-wide text-left ${
                 isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
             }`}>
                Settings
             </span>
         </button>
         
         <button 
           onClick={onOpenProfile}
           className={`h-10 w-full flex items-center rounded-lg hover:bg-nothing-black/5 transition-colors group ${isCollapsed ? 'justify-center' : 'px-2'}`}
           title="Profile"
         >
            <div className={`flex items-center justify-center shrink-0 text-nothing-black ${isCollapsed ? '' : 'mr-3'}`}>
               <User size={18} strokeWidth={1.5} />
            </div>
            <div className={`flex-1 overflow-hidden whitespace-nowrap transition-all duration-500 text-left ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
            }`}>
                <div className="text-xs font-bold text-nothing-black uppercase tracking-wide">User.01</div>
            </div>
         </button>
      </div>
    </div>
  );
};

export default Sidebar;
