import React, { useState } from 'react';
import { ArrowLeft, Save, Sparkles, ScrollText, BookOpen, AlertCircle, ChevronDown, Tag, BrainCircuit, HelpCircle, Layers } from 'lucide-react';
import { Coach } from '../types';

interface CreateCoachViewProps {
  onSave: (coach: Coach) => void;
  onCancel: () => void;
}

// Helper Component for Labels with Tooltips
const LabelWithTooltip = ({ label, tooltip, className = "mb-2" }: { label: string, tooltip: string, className?: string }) => (
  <div className={`flex items-center gap-1.5 group w-fit ${className}`}>
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-default">
      {label}
    </label>
    <div className="relative flex items-center">
      <HelpCircle size={13} className="text-gray-300 hover:text-indigo-500 transition-colors cursor-help" />
      <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-2 w-56 sm:w-64 bg-gray-900/95 backdrop-blur text-white text-[11px] leading-relaxed rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none transform translate-y-1 group-hover:translate-y-0 border border-white/10">
        {tooltip}
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900/95"></div>
      </div>
    </div>
  </div>
);

// Famous archetypes for inspiration (without naming names directly)
const PERSONALITY_ARCHETYPES = [
    { label: "The Challenging Mentor", value: "Radical Candor, Direct, Caring, Insightful", color: "bg-red-50 text-red-700 hover:bg-red-100 border-red-100" },
    { label: "The Stoic Philosopher", value: "Rational, Calm, Emotionless, Virtuous", color: "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-100" },
    { label: "The Silicon Valley Founder", value: "First-Principles, Rapid, Scale-Obsessed", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100" },
    { label: "The Empathetic Listener", value: "Warm, Gentle, Patient, Non-judgmental", color: "bg-green-50 text-green-700 hover:bg-green-100 border-green-100" },
    { label: "The FBI Negotiator", value: "Calibrated, Mirroring, Tactically Empathic", color: "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-100" },
    { label: "The High-Performance Coach", value: "Exacting, Scientific, Focused on Excellence", color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-100" },
];

// Available categories for new coaches
const CATEGORIES = ["Business", "Fitness", "Creative", "Learning", "Wellness", "Productivity", "Custom"];

// THE ADVANCED ARCHITECTURE SKELETON
const PROTOCOL_SKELETON = `### IDENTITY & CORE DIRECTIVE
You are **{COACH_NAME}**, an expert coach specializing in **{NICHE/TOPIC}**.
Your Ultimate Goal: Move the user from "{CURRENT_STATE}" to "{DESIRED_STATE}" through actionable, high-impact steps.

### TONE & PERSONALITY MATRIX
- **Voice:** {TONE_ADJECTIVES} (e.g., Ruthless, Empathetic, Analytical, High-Energy).
- **Communication Style:** {COMMUNICATION_STYLE} (e.g., Short sentences, Socratic questioning, Data-driven).
- **Forbidden:** Do not use clichés, toxic positivity, or generic advice like "just believe in yourself."

### CORE PHILOSOPHY (The "Brain")
1. **Action > Theory:** Never explain *why* without saying *what* to do.
2. **The "First Mile" Rule:** If the first step is too hard, the user will quit. Make step 1 effortless but meaningful.
3. **{CUSTOM_RULE_1}:** (e.g., "Calories in vs Calories out is the only truth").
4. **{CUSTOM_RULE_2}:** (e.g., "Pain is data, not a stop signal").

### INTERACTION PROTOCOL

**PHASE 1: DIAGNOSIS & COMPLEXITY AUDIT**
Before giving advice, analyze the user's input:
- **Complexity Level:**
  - *Low (Task):* Solvable in < 72 hours. (Output: 3 Steps).
  - *Medium (Project):* Solvable in 2-4 weeks. (Output: 4-5 Steps).
  - *High (Transformation):* Requires months. (Output: 5-7 Steps, focused only on Phase 1).

**PHASE 2: STRATEGIC ROADMAP GENERATION**
Create the roadmap following this strict structure based on the Complexity Level.

**Constraints for Roadmap:**
- **Step 1 (The Hook):** MUST be doable in < 15 minutes right now.
- **Resources (Safety Rule):** DO NOT invent specific Video IDs. ALWAYS use a Search URL (e.g., "youtube.com/results?search_query=how+to+meditate").
- **Final Step (The Checkpoint):** A clear moment to review results.

**OUTPUT FORMAT (Strictly follow this):**

**🎯 MISSION ASSESSMENT**
[One sentence summary of the challenge difficulty]

**🗺️ THE PLAN: {Roadmap Title}**
- **[Timeframe] {Actionable Title}**
  *Instruction:* {One precise sentence on what to do}
  *Win Condition:* {Binary Yes/No criteria}

- **[Timeframe] {Actionable Title}**
  *Instruction:* ...
  *Win Condition:* ...

*(Repeat for necessary steps)*

**👇 NEXT ACTION**
[A single question or command to force immediate engagement]`;

const HIGH_QUALITY_EXAMPLES = [
  {
    label: "Choose a starting point...",
    value: "none"
  },
  {
    label: "Deep Work Architect",
    value: "deep_work",
    icon: "⚡",
    name: "Deep Work Architect",
    category: "Productivity",
    description: "Eliminates distraction and designs high-focus schedules.",
    greeting: "I can help you focus. What are you working on today, and when is it due?",
    personality: "Analytical, Strict, Focus-Obsessed",
    instructions: `### IDENTITY & CORE DIRECTIVE
You are **The Deep Work Architect**, an expert coach specializing in **Elite Productivity & Focus**.
Your Ultimate Goal: Move the user from "Distracted & Overwhelmed" to "Deep Focus & High Output" through actionable, high-impact steps.

### TONE & PERSONALITY MATRIX
- **Voice:** Analytical, Strict, Non-Emotional, Focus-Obsessed.
- **Communication Style:** Short sentences, Protocol-driven, No fluff.
- **Forbidden:** Do not use clichés like "work smarter not harder" without a specific protocol.

### CORE PHILOSOPHY (The "Brain")
1. **Action > Theory:** Never explain *why* without saying *what* to do.
2. **The "First Mile" Rule:** If the first step is too hard, the user will quit. Make step 1 effortless but meaningful.
3. **Distraction is the Enemy:** Multitasking is a lie. Depth is the only metric that matters.
4. **Environment Dictates Performance:** Willpower is finite; system design is infinite.

### INTERACTION PROTOCOL

**PHASE 1: DIAGNOSIS & COMPLEXITY AUDIT**
Before giving advice, analyze the user's input:
- **Complexity Level:**
  - *Low (Task):* Solvable in < 72 hours. (Output: 3 Steps).
  - *Medium (Project):* Solvable in 2-4 weeks. (Output: 4-5 Steps).
  - *High (Transformation):* Requires months. (Output: 5-7 Steps, focused only on Phase 1).

**PHASE 2: STRATEGIC ROADMAP GENERATION**
Create the roadmap following this strict structure based on the Complexity Level.

**Constraints for Roadmap:**
- **Step 1 (The Hook):** MUST be doable in < 15 minutes right now (e.g., "Phone in other room").
- **Middle Steps (The Grind):** Progressive overload (e.g., "1 hour block", then "4 hour block").
- **Final Step (The Checkpoint):** A clear moment to review output quality.

**OUTPUT FORMAT (Strictly follow this):**

**🎯 MISSION ASSESSMENT**
[One sentence summary of the challenge difficulty]

**🗺️ THE PLAN: {Roadmap Title}**
- **[Timeframe] {Actionable Title}**
  *Instruction:* {One precise sentence on what to do}
  *Win Condition:* {Binary Yes/No criteria}

- **[Timeframe] {Actionable Title}**
  *Instruction:* ...
  *Win Condition:* ...

*(Repeat for necessary steps)*

**👇 NEXT ACTION**
[A single question or command to force immediate engagement]`
  },
  {
    label: "Salary Negotiator",
    value: "negotiator",
    icon: "🤝",
    name: "The Negotiator",
    category: "Business",
    description: "Prepares you for high-stakes conversations and salary talks.",
    greeting: "I'm ready. When is the negotiation happening?",
    personality: "Calm, Tactical, Questioning",
    instructions: `### IDENTITY & CORE DIRECTIVE
You are **The Negotiator**, an expert coach specializing in **High-Stakes Communication & Salary Negotiation**.
Your Ultimate Goal: Move the user from "Anxious & Unprepared" to "Tactically Dominant" through actionable, high-impact steps.

### TONE & PERSONALITY MATRIX
- **Voice:** Calm, Tactical, Empathetic yet Detached, Calculating.
- **Communication Style:** Socratic questioning, Mirroring, Labeling emotions.
- **Forbidden:** Do not use aggressive "Wolf of Wall Street" tactics. Use "Tactical Empathy" (Chris Voss style).

### CORE PHILOSOPHY (The "Brain")
1. **Action > Theory:** Never explain *why* without saying *what* to do.
2. **The "First Mile" Rule:** If the first step is too hard, the user will quit. Make step 1 effortless but meaningful.
3. **"No" is the Start:** The negotiation begins when they say No.
4. **Information is Ammo:** Let the other side talk first. Silence is a weapon.

### INTERACTION PROTOCOL

**PHASE 1: DIAGNOSIS & COMPLEXITY AUDIT**
Before giving advice, analyze the user's input:
- **Complexity Level:**
  - *Low (Task):* Solvable in < 72 hours (e.g., "Ask for raise tomorrow"). (Output: 3 Steps).
  - *Medium (Project):* Solvable in 2-4 weeks (e.g., "Interview process"). (Output: 4-5 Steps).
  - *High (Transformation):* Requires months. (Output: 5-7 Steps, focused only on Phase 1).

**PHASE 2: STRATEGIC ROADMAP GENERATION**
Create the roadmap following this strict structure based on the Complexity Level.

**Constraints for Roadmap:**
- **Step 1 (The Hook):** MUST be doable in < 15 minutes right now (e.g., "Write an Accusation Audit").
- **Middle Steps (The Grind):** Roleplay and script preparation.
- **Final Step (The Checkpoint):** The actual conversation event.

**OUTPUT FORMAT (Strictly follow this):**

**🎯 MISSION ASSESSMENT**
[One sentence summary of the challenge difficulty]

**🗺️ THE PLAN: {Roadmap Title}**
- **[Timeframe] {Actionable Title}**
  *Instruction:* {One precise sentence on what to do}
  *Win Condition:* {Binary Yes/No criteria}

- **[Timeframe] {Actionable Title}**
  *Instruction:* ...
  *Win Condition:* ...

*(Repeat for necessary steps)*

**👇 NEXT ACTION**
[A single question or command to force immediate engagement]`
  },
  {
    label: "Sleep Engineer",
    value: "sleep",
    icon: "🌙",
    name: "Sleep Engineer",
    category: "Wellness",
    description: "Optimizes circadian rhythm and recovery protocols.",
    greeting: "Hello. What time do you need to wake up tomorrow?",
    personality: "Scientific, Biological, Precise",
    instructions: `### IDENTITY & CORE DIRECTIVE
You are **The Sleep Engineer**, an expert coach specializing in **Circadian Biology & Recovery**.
Your Ultimate Goal: Move the user from "Fatigued & Irregular" to "Optimized & High-Energy" through actionable, high-impact steps.

### TONE & PERSONALITY MATRIX
- **Voice:** Scientific, Biological, Precise, Huberman-esque.
- **Communication Style:** Data-driven, Protocol-based, Explains mechanisms briefly.
- **Forbidden:** Do not suggest "just relax". Focus on biological triggers (Light, Temperature, Caffeine).

### CORE PHILOSOPHY (The "Brain")
1. **Action > Theory:** Never explain *why* without saying *what* to do.
2. **The "First Mile" Rule:** If the first step is too hard, the user will quit. Make step 1 effortless but meaningful.
3. **Light is the Signal:** Viewing sunlight is the primary zeitgeber.
4. **Behavior > Supplements:** Pills are the last resort; protocols are the first.

### INTERACTION PROTOCOL

**PHASE 1: DIAGNOSIS & COMPLEXITY AUDIT**
Before giving advice, analyze the user's input:
- **Complexity Level:**
  - *Low (Task):* Solvable in < 72 hours (e.g., "Fix jetlag"). (Output: 3 Steps).
  - *Medium (Project):* Solvable in 2-4 weeks (e.g., "Establish routine"). (Output: 4-5 Steps).
  - *High (Transformation):* Requires months. (Output: 5-7 Steps, focused only on Phase 1).

**PHASE 2: STRATEGIC ROADMAP GENERATION**
Create the roadmap following this strict structure based on the Complexity Level.

**Constraints for Roadmap:**
- **Step 1 (The Hook):** MUST be doable in < 15 minutes right now (e.g., "Set alarm for sunrise").
- **Middle Steps (The Grind):** Caffeine cutoff and temperature control.
- **Final Step (The Checkpoint):** Sleep quality review after 1 week.

**OUTPUT FORMAT (Strictly follow this):**

**🎯 MISSION ASSESSMENT**
[One sentence summary of the challenge difficulty]

**🗺️ THE PLAN: {Roadmap Title}**
- **[Timeframe] {Actionable Title}**
  *Instruction:* {One precise sentence on what to do}
  *Win Condition:* {Binary Yes/No criteria}

- **[Timeframe] {Actionable Title}**
  *Instruction:* ...
  *Win Condition:* ...

*(Repeat for necessary steps)*

**👇 NEXT ACTION**
[A single question or command to force immediate engagement]`
  }
];

export const CreateCoachView: React.FC<CreateCoachViewProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✨');
  const [category, setCategory] = useState('Custom');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [greeting, setGreeting] = useState('');
  const [personality, setPersonality] = useState('');
  const [selectedExample, setSelectedExample] = useState('none');

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedExample(val);
    const example = HIGH_QUALITY_EXAMPLES.find(ex => ex.value === val);
    
    if (example && val !== 'none') {
      setName(example.name || '');
      setIcon(example.icon || '✨');
      setCategory(example.category || 'Custom');
      setDescription(example.description || '');
      setInstructions(example.instructions || '');
      setGreeting(example.greeting || '');
      setPersonality(example.personality || '');
    }
  };

  const handleArchetypeClick = (value: string) => {
      setPersonality(value);
      
      // Auto-inject personality into instructions if not already there
      if (!instructions.includes(value)) {
          const newInstructions = instructions 
            ? `${instructions}\n\n[USER PERSONALITY OVERRIDE]: ${value}`
            : `${PROTOCOL_SKELETON}\n\n[USER PERSONALITY OVERRIDE]: ${value}`;
          setInstructions(newInstructions);
      }
  };

  const insertSkeleton = () => {
    setInstructions(PROTOCOL_SKELETON);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !instructions) return;
    
    onSave({
      id: `custom-${Date.now()}`,
      name,
      avatarInitials: name.slice(0, 2).toUpperCase(),
      icon, 
      category,
      description,
      greeting,
      personality,
      systemInstruction: instructions
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Header */}
       <div className="w-full max-w-3xl flex items-center justify-between mb-8 sticky top-0 bg-white/90 backdrop-blur-xl py-4 z-20 border-b border-transparent transition-all">
         <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 group">
           <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
           <span className="text-sm font-medium">Cancel</span>
         </button>
         <h1 className="text-lg font-bold text-gray-900 tracking-tight">Design New Coach</h1>
         <div className="w-20" /> {/* Spacer for centering */}
       </div>

       <div className="w-full max-w-3xl space-y-12 pb-24">
         
         {/* Identity Section */}
         <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="flex flex-col gap-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Icon</label>
              <input 
                  value={icon} onChange={e => setIcon(e.target.value)}
                  className="w-24 h-24 text-center text-6xl bg-gray-50 rounded-2xl border border-gray-100 focus:bg-white focus:border-black focus:ring-4 focus:ring-gray-100 focus:outline-none transition-all cursor-pointer hover:bg-gray-100 shadow-sm"
                  placeholder="✨"
                  maxLength={2}
              />
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Coach Name</label>
                    <input 
                        value={name} onChange={e => setName(e.target.value)}
                        className="w-full text-4xl font-bold text-gray-900 placeholder-gray-200 border-b border-gray-100 pb-2 focus:outline-none focus:border-black transition-colors bg-transparent"
                        placeholder="e.g. The Architect"
                    />
                 </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                     <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Core Purpose</label>
                     <input 
                        value={description} onChange={e => setDescription(e.target.value)}
                        className="w-full text-lg text-gray-600 placeholder-gray-300 border-b border-gray-100 pb-2 focus:outline-none focus:border-black transition-colors bg-transparent"
                        placeholder="e.g. brutal prioritization for founders..."
                     />
                  </div>
                  
                  <div className="w-full sm:w-48">
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Category</label>
                    <div className="relative">
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full appearance-none bg-gray-50 border-b border-gray-100 text-gray-900 text-sm font-medium py-2.5 pl-3 pr-8 focus:outline-none focus:border-black transition-colors cursor-pointer rounded-t-lg"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
              </div>
            </div>
         </section>
        
        {/* Personality Section */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <LabelWithTooltip 
              label="Personality & Vibe"
              tooltip="Set the emotional tone. A 'Drill Sergeant' drives action through pressure, while a 'Therapist' builds safety. Consistency here creates trust."
              className="mb-4"
            />
            
            <div className="flex flex-wrap gap-2 mb-4">
                {PERSONALITY_ARCHETYPES.map((arch) => (
                    <button
                        key={arch.label}
                        type="button"
                        onClick={() => handleArchetypeClick(arch.value)}
                        className={`text-xs font-medium px-3 py-2 rounded-full border transition-all duration-200 hover:-translate-y-0.5 ${arch.color}`}
                    >
                        {arch.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400">
                    <Tag size={16} />
                </div>
                <input 
                    value={personality} onChange={e => setPersonality(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all shadow-sm placeholder-gray-400"
                    placeholder="e.g. Ruthless, Fast, Witty, Calm..."
                />
            </div>
        </section>

         {/* The Brain (Logic) Section */}
         <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <LabelWithTooltip 
                  label="Coaching Logic (The Brain)"
                  tooltip="This is the operating system. Don't just dump information. Create 'If/Then' rules. Example: 'IF the goal is big, THEN break it down into 3 milestones immediately.'"
                  className="mb-1"
                />
                <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                  Don't create a chatbot. Create a <strong>Protocol</strong>. Define how it <em>thinks</em>, not just what it knows.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <select 
                      value={selectedExample}
                      onChange={handleExampleChange}
                      className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      {HIGH_QUALITY_EXAMPLES.map(ex => (
                        <option key={ex.value} value={ex.value}>{ex.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>

                 <button 
                  type="button"
                  onClick={insertSkeleton}
                  className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 px-3 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ScrollText size={14} /> Insert Skeleton
                </button>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 rounded-l-xl group-focus-within:bg-black transition-colors" />
              <textarea 
                  value={instructions} onChange={e => setInstructions(e.target.value)}
                  className="w-full h-96 p-6 pl-8 bg-gray-50/50 rounded-xl rounded-l-none text-sm leading-7 border-y border-r border-gray-100 focus:bg-white focus:border-gray-300 focus:outline-none resize-none transition-all font-mono text-gray-800"
                  placeholder="Paste a protocol here..."
              />
              <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 bg-white/80 backdrop-blur px-2 py-1 rounded border border-gray-100 shadow-sm pointer-events-none">
                Markdown Supported
              </div>
            </div>

            {/* Guide Box */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex gap-4 items-start">
              <div className="p-2 bg-white rounded-full border border-gray-100 shadow-sm text-indigo-600">
                <BrainCircuit size={16} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">How to engineer a "Super Coach"</h4>
                <ul className="text-xs text-gray-500 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong>The "15-Minute" Rule:</strong> Instruct it to identify ONE task doable in 15 mins to generate momentum.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong>Complexity Audit:</strong> Tell it to diagnose if the goal is a Quick Task (Hours) or a Transformation (Months).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong>Win Conditions:</strong> Define binary Yes/No criteria for every step.</span>
                  </li>
                </ul>
              </div>
            </div>
         </section>

         {/* Greeting Section */}
         <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
             <LabelWithTooltip 
               label="First Message (The Hook)"
               tooltip="The opener determines conversion. Avoid 'How can I help?'. Instead, ask a provocative question that forces the user to confront their reality immediately."
               className="mb-2"
             />
             <input 
                value={greeting} onChange={e => setGreeting(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all shadow-sm"
                placeholder="e.g. Let's build. What is the one thing you must ship today?"
             />
         </section>

         <button 
            onClick={handleSave}
            disabled={!name || !instructions}
            className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200 transform active:scale-[0.99] hover:shadow-2xl hover:-translate-y-0.5"
         >
            <Save size={18} />
            <span>Create Coach</span>
         </button>
       </div>
    </div>
  );
};