
import React, { useState } from 'react';
import { Milestone, Task } from '../types';
import { Check, Calendar, Target, Flag, Circle, CheckCircle2, ChevronDown, Maximize2, Minimize2, Edit2, X, FileText, Sparkles, CircleDashed, Clock, ExternalLink, PlayCircle, Repeat, Zap } from 'lucide-react';

interface PlanViewProps {
  milestones: Milestone[];
  onToggleTask: (milestoneId: string, taskId: string) => void;
  onUpdateMilestone?: (milestone: Milestone) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ milestones, onToggleTask, onUpdateMilestone, isFullScreen, onToggleFullScreen }) => {
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  // Calculate aggregate progress
  const totalTasks = milestones.reduce((acc, m) => acc + m.tasks.length, 0);
  const completedTasks = milestones.reduce((acc, m) => acc + m.tasks.filter(t => t.isCompleted).length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const activeMilestone = editingMilestoneId ? milestones.find(m => m.id === editingMilestoneId) : null;

  if (milestones.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 relative">
        <div className="w-24 h-24 mb-8 rounded-3xl bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-300 rotate-3">
          <Calendar size={40} />
        </div>
        <h3 className="text-gray-900 font-bold text-xl mb-3 tracking-tight">System & Roadmap</h3>
        <p className="text-gray-500 text-base max-w-xs leading-relaxed">
          Ask your coach to design a <strong>System</strong>. We will build a roadmap with phases and daily habits.
        </p>
      </div>
    );
  }

  // Helper to determine if a milestone is the "Next Up" (first incomplete one)
  const firstIncompleteIndex = milestones.findIndex(m => !m.tasks.every(t => t.isCompleted));

  return (
    <div className="flex flex-col bg-white h-full relative">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6 z-20 flex-shrink-0 sticky top-0">
        <div className="flex items-end justify-between mb-5">
            <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">The Roadmap</h2>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm transition-colors ${progress === 100 ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                    {completedTasks}/{totalTasks} DONE
                  </span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    System Active
                  </span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {progress === 100 && (
                    <div className="text-yellow-500 animate-in zoom-in spin-in-12 duration-500 mr-2">
                        <Flag size={28} fill="currentColor" />
                    </div>
                )}
                <button 
                    onClick={onToggleFullScreen}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                    title={isFullScreen ? "Exit Zen Mode" : "Zen Mode"}
                >
                    {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
            <div 
                className={`h-full transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1) rounded-full relative overflow-hidden ${progress === 100 ? 'bg-green-500' : 'bg-black'}`}
                style={{ width: `${progress}%` }}
            >
               <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12" />
            </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative bg-gray-50">
        {/* Vertical Line */}
        <div className="absolute left-[35px] sm:left-[43px] top-8 bottom-8 w-[2px] bg-gray-200/70" />

        <div className="space-y-12 relative pb-12">
          {milestones.map((milestone, mIndex) => {
            const isMilestoneComplete = milestone.tasks.every(t => t.isCompleted);
            const isActive = mIndex === firstIncompleteIndex; // It's the current focus
            
            return (
              <div 
                key={milestone.id} 
                className="relative pl-14 sm:pl-16 animate-in fade-in slide-in-from-bottom-6"
                style={{ animationDelay: `${mIndex * 100}ms` }}
              >
                {/* Milestone Node on Timeline */}
                <div 
                    onClick={() => setEditingMilestoneId(milestone.id)}
                    className={`
                        absolute left-[24px] sm:left-[32px] top-7 w-6 h-6 rounded-full z-10 flex items-center justify-center transition-all duration-500 shadow-sm cursor-pointer hover:scale-110
                        ${isMilestoneComplete 
                            ? 'bg-green-500 text-white border-green-500' 
                            : isActive 
                                ? 'bg-white border-[3px] border-indigo-600 ring-4 ring-indigo-50' 
                                : 'bg-white border-[3px] border-gray-300'
                        }
                    `}
                >
                    {isMilestoneComplete && <Check size={14} strokeWidth={4} />}
                    {!isMilestoneComplete && isActive && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                </div>

                {/* Milestone Card */}
                <div 
                    onClick={() => setEditingMilestoneId(milestone.id)}
                    className={`
                    bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm group cursor-pointer
                    ${isMilestoneComplete 
                        ? 'border-green-100 bg-green-50/10' 
                        : isActive
                            ? 'border-indigo-100 shadow-md ring-1 ring-indigo-50/50'
                            : 'border-gray-200/80 hover:shadow-lg hover:border-gray-300/50 hover:-translate-y-0.5'
                    }
                `}>
                    {/* Milestone Header */}
                    <div className={`px-6 py-6 border-b flex justify-between items-start gap-4 ${isMilestoneComplete ? 'bg-green-50/20 border-green-100' : 'bg-white border-gray-100'}`}>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-2 ${isMilestoneComplete ? 'text-green-600' : isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {milestone.timeframe}
                                    {isActive && !isMilestoneComplete && (
                                        <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px]">ACTIVE PHASE</span>
                                    )}
                                </div>
                            </div>
                            
                            <h3 className={`font-bold text-xl sm:text-2xl leading-snug transition-all ${isMilestoneComplete ? 'text-gray-400 line-through decoration-gray-300 decoration-2' : 'text-gray-900'}`}>
                                {milestone.title}
                            </h3>
                        </div>
                        
                        <div className="flex-shrink-0 mt-1 text-gray-300">
                             {isMilestoneComplete ? (
                                 <div className="bg-green-100 p-1.5 rounded-full text-green-600 animate-in zoom-in duration-300">
                                     <Sparkles size={20} fill="currentColor" className="opacity-50" />
                                 </div>
                             ) : isActive ? (
                                 <Clock size={24} className="text-indigo-200" />
                             ) : (
                                 <CircleDashed size={24} />
                             )}
                        </div>
                    </div>

                    {/* Tasks Container */}
                    <div className="p-4 sm:p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {milestone.tasks.map((task, tIndex) => {
                            const isHabit = task.type === 'habit';
                            
                            return (
                                <div
                                    key={task.id}
                                    className={`
                                        group/task flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-all duration-300 border relative
                                        ${task.isCompleted 
                                            ? 'bg-gray-50/50 border-transparent' 
                                            : isHabit
                                                ? 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
                                                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100 shadow-sm'
                                        }
                                    `}
                                    onClick={() => onToggleTask(milestone.id, task.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox / Icon */}
                                        <div className={`
                                            mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                                            ${task.isCompleted 
                                                ? 'bg-green-500 border-green-500 text-white scale-100' 
                                                : isHabit
                                                    ? 'border-amber-400 text-amber-500 bg-white group-hover/task:bg-amber-50'
                                                    : 'border-gray-300 bg-white group-hover/task:border-gray-400 scale-95 group-hover/task:scale-100'
                                            }
                                        `}>
                                            {task.isCompleted ? (
                                                <Check size={14} strokeWidth={4} className="animate-in zoom-in duration-200" />
                                            ) : isHabit ? (
                                                <Repeat size={14} strokeWidth={3} />
                                            ) : (
                                                <div className="w-0 h-0" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            {/* Habit Badge */}
                                            {isHabit && !task.isCompleted && (
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                        <Zap size={10} fill="currentColor" /> THE SYSTEM
                                                    </span>
                                                </div>
                                            )}

                                            <span className={`text-[15px] sm:text-base leading-relaxed font-medium transition-colors block ${task.isCompleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700 group-hover/task:text-gray-900'}`}>
                                                {task.text}
                                            </span>
                                            
                                            {/* RESOURCE LINK */}
                                            {task.resource && (
                                                <a 
                                                    href={task.resource.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()} // Prevent toggling task
                                                    className={`
                                                        mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border
                                                        ${task.isCompleted 
                                                            ? 'bg-gray-100 text-gray-400 border-gray-100' 
                                                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-sm'
                                                        }
                                                    `}
                                                >
                                                    {task.resource.url.includes('youtube') || task.resource.url.includes('youtu.be') ? <PlayCircle size={12} fill="currentColor" className="opacity-20" /> : <ExternalLink size={12} />}
                                                    {task.resource.title}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Overlay / Side Sheet */}
      {activeMilestone && (
        <div className="absolute inset-0 z-50 flex justify-end">
            <div 
                className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity"
                onClick={() => setEditingMilestoneId(null)}
            />
            <div className="relative w-full sm:w-[500px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Overlay Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur z-10">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeMilestone.timeframe}</span>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mt-1">{activeMilestone.title}</h3>
                    </div>
                    <button 
                        onClick={() => setEditingMilestoneId(null)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Overlay Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                     {/* Tasks in Overlay */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Target size={14} /> Action Items
                        </h4>
                        <div className="space-y-3">
                            {activeMilestone.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`
                                        flex flex-col p-3 rounded-lg cursor-pointer bg-white border transition-all hover:border-gray-300
                                        ${task.isCompleted ? 'opacity-60 border-gray-200' : 'border-gray-200'}
                                    `}
                                    onClick={() => onToggleTask(activeMilestone.id, task.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`
                                            mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors duration-200
                                            ${task.isCompleted 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : task.type === 'habit' 
                                                    ? 'border-amber-400 text-amber-500' 
                                                    : 'border-gray-300 bg-white'
                                            }
                                        `}>
                                            {task.isCompleted && <Check size={12} strokeWidth={4} />}
                                            {!task.isCompleted && task.type === 'habit' && <Repeat size={10} />}
                                        </div>
                                        <div>
                                            {task.type === 'habit' && !task.isCompleted && (
                                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded mb-1 inline-block">HABIT</span>
                                            )}
                                            <span className={`text-sm leading-relaxed block ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                {task.text}
                                            </span>
                                        </div>
                                    </div>
                                    {task.resource && (
                                         <a 
                                            href={task.resource.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="ml-8 mt-2 text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 w-fit"
                                        >
                                            <ExternalLink size={10} /> {task.resource.title}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes Editor */}
                    <div className="h-full min-h-[300px]">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={14} /> Strategy Notes & Reflections
                        </h4>
                        <textarea
                            value={activeMilestone.notes || ''}
                            onChange={(e) => {
                                if (onUpdateMilestone) {
                                    onUpdateMilestone({ ...activeMilestone, notes: e.target.value });
                                }
                            }}
                            placeholder="Write your thoughts, technical details, or brain dumps here. It saves automatically..."
                            className="w-full h-[400px] p-5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all text-sm leading-7 text-gray-700 placeholder-gray-400 resize-none font-medium"
                        />
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
