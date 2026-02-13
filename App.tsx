
import React, { useState, useEffect, useRef } from 'react';
import { ChatView } from './components/ChatView';
import { PlanView } from './components/PlanView';
import { EmailDialog } from './components/EmailDialog';
import { CoachSelection } from './components/CoachSelection';
import { CreateCoachView } from './components/CreateCoachView';
import { LiveSessionView } from './components/LiveSessionView';
import { Paywall } from './components/Paywall'; 
import { DeleteAccountPage } from './components/DeleteAccountPage'; 
import { TabView, Message, Milestone, Coach } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { triggerPlanWebhook } from './services/n8nService';
import { auth, saveCoachToFirestore, fetchCommunityCoaches, fetchMyCoaches, signInWithGoogle, logout, saveAndActivatePlan, fetchLastSession, saveSession, deleteSession, checkRedirect } from './services/firebase';
import { revenueCat } from './services/revenueCatService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MessageSquare, ClipboardList, ChevronLeft, Share, Layout, Loader2, Trash2, AlertTriangle, X, Crown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// Static Data (System Coaches)
const DEFAULT_COACHES: Coach[] = [
  {
    id: 'marcus',
    name: 'Marcus',
    avatarInitials: 'M',
    icon: '🚀',
    category: 'Business',
    description: 'Startup Strategy. A strategic ally who focuses on risk mitigation, rapid experiments, and finding the path of least resistance.',
    personality: 'Rigorous, Constructive, Data-Driven',
    greeting: "I'm ready to help you scale. But first, let's look at the foundation. What is the vision, and what is the biggest 'Leap of Faith' assumption you are making right now?",
    systemInstruction: `You are Marcus, a world-class startup advisor (modeled after a Senior YC Partner).

    PHILOSOPHY (THE STRATEGIC ALLY):
    - You are NOT a Judge; you are a Co-Conspirator. 
    - Your goal is not to kill the idea, but to "De-Risk" it.
    - Validate the VISION before attacking the MECHANICS.
    
    PROTOCOL:
    PHASE 1: REALITY CHECK (DIAGNOSIS)
    - Identify if this is a "Feature", a "Product", or a "Company" (Complexity Analysis).
    - Analyze the "Friction" (Economic vs Physical).
    
    PHASE 2: THE EXPERIMENT STRATEGY
    - Propose "The Smile Test" or "Smoke Tests" to validate demand cheaply.
    
    PHASE 3: STRATEGIC ROADMAP (EXECUTION)
    - Apply the Global Complexity Rules.
    - If it's a big startup idea, focus ONLY on the first month (Validation Phase).
    - STEP 1 must be a "Smoke Test" or "Interview" doable TOMORROW.
    `
  },
  {
    id: 'coach_k',
    name: 'Coach K',
    avatarInitials: 'CK',
    icon: '💪',
    category: 'Fitness',
    description: 'Elite Performance. Focuses on physiology, precision, and consistency.',
    personality: 'Exacting, Scientific, Motivating',
    greeting: "Performance starts with clarity. What is your physical goal, and what equipment do we have access to?",
    systemInstruction: `You are Coach K, an elite athletic trainer.

    PROTOCOL:
    PHASE 1: DISCOVERY (DIAGNOSIS)
    - Ask about: Injuries and available equipment.
    - Ask: "What is your goal?" (Strength, Aesthetics, etc.)
    
    PHASE 2: STRATEGY
    - Determine Complexity: Is this a 4-week tune-up or a 6-month transformation?
    - PROGRESSIVE OVERLOAD (MANDATORY): Plans must evolve. Increase intensity, volume, or complexity week-over-week. No static routines.
    
    PHASE 3: STRATEGIC ROADMAP
    - ASSIGN the schedule.
    - If "Transformation": Focus on "Phase 1: Adaptation" (First 30 days) but ensure week 4 is harder than week 1.
    `
  },
  {
    id: 'luna',
    name: 'Luna',
    avatarInitials: 'L',
    icon: '✨',
    category: 'Creative',
    description: 'Content & Personal Brand. Focuses on viral hooks, storytelling, and audience growth.',
    personality: 'Creative, Trendy, Empathetic',
    greeting: "Hey there. What kind of story or message are you trying to share with the world?",
    systemInstruction: `You are Luna, a viral content strategist.

    PROTOCOL:
    PHASE 1: DISCOVERY (MANDATORY)
    - Ask: "Who is the target audience?"
    
    PHASE 2: STRATEGY
    - Design a content rollout based on complexity (Single Launch vs Brand Build).
    
    PHASE 3: STRATEGIC ROADMAP
    - ASSIGN a posting schedule.
    `
  },
  {
    id: 'aris',
    name: 'Aris',
    avatarInitials: 'A',
    icon: '🧠',
    category: 'Learning',
    description: 'Accelerated Learning. Focuses on mastering complex skills and passing exams.',
    personality: 'Stoic, Rational, First-Principles',
    greeting: "Knowledge requires a solid foundation. What topic are you looking to master?",
    systemInstruction: `You are Aris, an expert in meta-learning.

    PROTOCOL:
    PHASE 1: DISCOVERY
    - Ask: "What is your current level?"
    
    PHASE 2: STRATEGY
    - Break it down.
    
    PHASE 3: STRATEGIC ROADMAP
    - ASSIGN a curriculum timeline.
    `
  },
  {
    id: 'maya',
    name: 'Maya',
    avatarInitials: 'MA',
    icon: '🌿',
    category: 'Wellness',
    description: 'Mindfulness & Clarity. Focuses on reducing stress and finding presence.',
    personality: 'Calm, Gentle, Present',
    greeting: "Hi. How are you feeling right now?",
    systemInstruction: `You are Maya, a mindfulness guide.

    PROTOCOL:
    PHASE 1: DISCOVERY
    - Ask open-ended questions about their state.
    
    PHASE 2: STRATEGY
    - Suggest a technique.
    
    PHASE 3: STRATEGIC ROADMAP
    - ASSIGN moments of pause in their day.
    `
  }
];

// UPDATED: Added DELETE_ACCOUNT to the main view enum
type AppView = 'CATALOG' | 'CREATE' | 'SESSION' | 'DELETE_ACCOUNT';

export default function App() {
  const [view, setView] = useState<AppView>('CATALOG');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // PRO STATE
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Data State
  const [dbCoaches, setDbCoaches] = useState<Coach[]>([]);
  const [activeCoach, setActiveCoach] = useState<Coach | null>(null);
  
  // SESSION STATE
  const [activeTab, setActiveTab] = useState<TabView>(TabView.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  // Layout State
  const [isPlanMaximized, setIsPlanMaximized] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // LIVE SESSION STATE
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);

  // Reference to track if initial load is done to prevent overwriting
  const isSessionLoadedRef = useRef(false);

  // --- AUTH & DATA LOADING ---
  
  useEffect(() => {
    // 1. Check for URL Routing (Google Play Policy compliance)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('page') === 'delete_account') {
        setView('DELETE_ACCOUNT');
    }

    // 2. Handle redirect result if user came back from Google Auth Redirect (fallback)
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (Capacitor.isNativePlatform()) {
        try {
            const userId = currentUser ? currentUser.uid : "anon_guest";
            // Initialize RC
            await revenueCat.initialize(userId);
            // Check status
            const hasEntitlement = await revenueCat.checkProStatus();
            setIsPro(hasEntitlement);
        } catch (e) {
            console.error("RC Init Failed in App.tsx", e);
            // Fallback to false, don't crash app
            setIsPro(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadCoaches = async () => {
      // 1. Fetch Public Community Coaches
      const publicCoaches = await fetchCommunityCoaches();
      
      let myCoaches: Coach[] = [];
      // 2. If logged in, fetch My Coaches
      if (user) {
        myCoaches = await fetchMyCoaches(user.uid);
      }

      // Merge: Avoid duplicates if my coaches are also public
      const mergedMap = new Map();
      publicCoaches.forEach(c => mergedMap.set(c.id, c));
      myCoaches.forEach(c => mergedMap.set(c.id, c)); 
      
      setDbCoaches(Array.from(mergedMap.values()));
    };

    loadCoaches();
  }, [user]);

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (user && activeCoach && isSessionLoadedRef.current) {
        // Only save if we have messages (don't save empty states over existing ones accidentally)
        if (messages.length > 0) {
            saveSession(user.uid, activeCoach.id, messages, milestones);
        }
    }
  }, [messages, milestones, user, activeCoach]);

  // Combine default and database coaches
  const allCoaches = [...DEFAULT_COACHES, ...dbCoaches];

  // -- Handlers --

  const handleAuthLogin = async () => {
    await signInWithGoogle();
  };

  const handleAuthLogout = async () => {
    await logout();
    setIsPro(false); // Reset PRO status
    setView('CATALOG');
  };

  const handleSelectCoach = async (coach: Coach) => {
    setActiveCoach(coach);
    setView('SESSION');
    setActiveTab(TabView.CHAT);
    setIsPlanMaximized(false); 
    setIsLiveSessionActive(false);
    isSessionLoadedRef.current = false; // Reset load state

    // 1. Check if user is logged in
    if (user) {
        // 2. Try to fetch existing session (Deterministic 1:1)
        setIsLoading(true);
        const savedSession = await fetchLastSession(user.uid, coach.id);
        
        if (savedSession) {
            // Restore Session
            setMessages(savedSession.messages);
            setMilestones(savedSession.milestones);
        } else {
            // Start New Session (in memory until first save)
            const initialMsg: Message = {
                id: Date.now().toString(),
                role: 'model',
                text: coach.greeting || "Hello. What is your goal for this session?",
                timestamp: new Date(),
            };
            setMessages([initialMsg]); 
            setMilestones([]);
        }
        setIsLoading(false);
    } else {
        // Guest Mode (No persistence)
        const initialMsg: Message = {
            id: Date.now().toString(),
            role: 'model',
            text: coach.greeting || "Hello. What is your goal for this session?",
            timestamp: new Date(),
        };
        setMessages([initialMsg]); 
        setMilestones([]);
    }
    
    // Mark as loaded so auto-save can resume
    isSessionLoadedRef.current = true;
  };

  const handleResetSession = async () => {
      // 1. If persistent session exists, delete it
      if (user && activeCoach) {
          try {
              // Delete by deterministic UserID + CoachID
              await deleteSession(user.uid, activeCoach.id);
          } catch (e) {
              console.error("Failed to delete session", e);
              alert("Error cleaning up previous session. Check console.");
              return;
          }
      }

      // 2. Reset Local State
      if (activeCoach) {
          const initialMsg: Message = {
            id: Date.now().toString(),
            role: 'model',
            text: activeCoach.greeting || "Hello. What is your goal for this session?",
            timestamp: new Date(),
          };
          setMessages([initialMsg]); 
          setMilestones([]);
      }
      
      setShowDeleteConfirm(false);
  };

  const handleCreateRequest = () => {
      // GATE: Creating a Coach is a PRO feature
      if (!isPro) {
          setShowPaywall(true);
          return;
      }
      if (!user) {
          handleAuthLogin();
      } else {
          setView('CREATE');
      }
  };

  const handleCreateCoach = async (newCoach: Coach) => {
    if (!user) return; 

    // Optimistic UI update
    setDbCoaches(prev => [newCoach, ...prev]);
    
    // Save to Firestore
    try {
        await saveCoachToFirestore(newCoach, user);
    } catch (e) {
        console.error("Failed to save coach", e);
    }

    handleSelectCoach(newCoach);
  };

  const handleBackToCatalog = () => {
    setActiveCoach(null);
    setView('CATALOG');
    setIsPlanMaximized(false);
    setIsLiveSessionActive(false);
    setMessages([]);
    setMilestones([]);
  };

  const handleShare = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${title}\n\n${text}`);
      alert("Copied to clipboard!");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeCoach) return;

    // GATE: Chat limit for Free users
    if (!isPro) {
        const userMsgCount = messages.filter(m => m.role === 'user').length;
        if (userMsgCount >= 3) {
            setShowPaywall(true);
            return;
        }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };
    
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setIsLoading(true);

    const lastMsg = messages[messages.length - 1];
    
    // INTERCEPTION LOGIC: Check if user is confirming a plan
    if (lastMsg && lastMsg.role === 'model' && lastMsg.isEmailPrompt) {
       const lowerText = text.toLowerCase();
       // Added Spanish keywords to the detection list
       const confirmationKeywords = ['yes', 'sure', 'please', 'do it', 'send', 'si', 'sí', 'claro', 'envia', 'envía', 'dale', 'ok', 'confirm', 'bueno'];
       
       if (confirmationKeywords.some(keyword => lowerText.includes(keyword))) {
         setIsLoading(false);
         // Open confirmation dialog directly instead of sending message to Gemini
         setIsActivationDialogOpen(true);
         return; 
       }
    }

    const { text: responseText, milestones: newMilestones, emailPrompt } = await sendMessageToGemini(
      currentHistory,
      text,
      activeCoach.systemInstruction
    );

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date(),
    };

    let updatedMessages = [...currentHistory, botMsg];
    
    if (newMilestones && newMilestones.length > 0) {
      setMilestones(newMilestones);
      
      if (emailPrompt) {
        const triggerMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'model',
            text: emailPrompt,
            timestamp: new Date(),
            isEmailPrompt: true 
        };
        updatedMessages = [...updatedMessages, triggerMsg];
      }

      // AUTO-TRIGGER: Automatically open the activation/confirmation dialog 
      // when a new plan is generated, saving the user from having to type "yes".
      setIsActivationDialogOpen(true);
    }

    setMessages(updatedMessages);
    setIsLoading(false);
  };

  const handleUpdateMilestone = (updatedMilestone: Milestone) => {
    setMilestones(prev => prev.map(m => 
      m.id === updatedMilestone.id ? updatedMilestone : m
    ));
  };

  const handleToggleTask = (milestoneId: string, taskId: string) => {
    setMilestones(prev => prev.map(m => {
        if (m.id !== milestoneId) return m;
        const updatedTasks = m.tasks.map(t => 
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        );
        return {
            ...m,
            tasks: updatedTasks,
            isCompleted: updatedTasks.every(t => t.isCompleted)
        };
    }));
  };

  const handlePlanActivation = async () => {
    if (!isPro) {
        setIsActivationDialogOpen(false);
        setShowPaywall(true);
        return;
    }

    if (!activeCoach || !user) return; 

    try {
        const derivedGoal = milestones.length > 0 ? milestones[milestones.length - 1].title : "Goal Achievement";

        await saveAndActivatePlan(
            user,
            activeCoach.name,
            derivedGoal,
            milestones,
            true, 
            user.email || "" 
        );

        setIsActivationDialogOpen(false);
        
        const confirmMsg: Message = {
          id: Date.now().toString(),
          role: 'model',
          text: `Plan activated. I've sent the system and roadmap to ${user.email}. Check your inbox.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMsg]);

    } catch (e) {
        console.error("Failed to activate plan", e);
        alert("Something went wrong saving your plan. Please try again.");
    }
  };

  // -- Render Logic --

  if (isAuthLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-white">
              <Loader2 className="animate-spin text-gray-300" size={32} />
          </div>
      );
  }

  // DELETE ACCOUNT PAGE (Accessible via URL or Nav)
  if (view === 'DELETE_ACCOUNT') {
      return (
          <DeleteAccountPage 
              user={user}
              onLogin={handleAuthLogin}
              onLogout={handleAuthLogout}
              onBack={() => setView('CATALOG')}
          />
      );
  }

  if (view === 'CREATE') {
    return <CreateCoachView onSave={handleCreateCoach} onCancel={() => setView('CATALOG')} />;
  }

  if (view === 'CATALOG' || !activeCoach) {
    return (
      <>
        <CoachSelection 
            coaches={allCoaches} 
            user={user}
            onSelect={handleSelectCoach} 
            onCreate={handleCreateRequest}
            onLogin={handleAuthLogin}
            onLogout={handleAuthLogout}
            onDeleteAccount={() => setView('DELETE_ACCOUNT')}
            onShare={(coach) => handleShare(
            `Meet my AI Coach: ${coach.name}`, 
            `${coach.description}\n\nBuilt on MODE.`
            )}
        />
        <Paywall 
            isOpen={showPaywall} 
            onClose={() => setShowPaywall(false)} 
            onSuccess={() => setIsPro(true)} 
        />
      </>
    );
  }

  // Session View
  return (
    <div className="flex flex-col h-screen bg-white w-full mx-auto animate-in fade-in duration-300">
      
      {/* Session Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <button onClick={handleBackToCatalog} className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
            <span className="font-bold text-gray-900 leading-none flex items-center gap-1.5">
                {activeCoach.name}
                {!isPro && <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">FREE</span>}
                {isPro && <span className="text-[9px] bg-black text-white px-1 rounded flex items-center gap-0.5"><Crown size={8}/> PRO</span>}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Session Active</span>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {!isPro && (
                <button 
                  onClick={() => setShowPaywall(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg mr-2 hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Crown size={14} className="text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Upgrade</span>
                </button>
            )}

            <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                title="Reset Session & Delete History"
            >
                <Trash2 size={18} />
            </button>

            <button 
            onClick={() => handleShare(`Chat with ${activeCoach.name}`, `I'm building a system with ${activeCoach.name} on MODE.`)} 
            className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
            title="Share Session"
            >
            <Share size={18} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className={`
            absolute inset-0 transition-transform duration-300 transform bg-white z-10
            ${activeTab === TabView.CHAT ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:flex-1 md:border-r md:border-gray-100 md:z-0
        `}>
          <ChatView 
            messages={messages} 
            coach={activeCoach} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            onStartLiveSession={() => setIsLiveSessionActive(true)}
          />
          {/* FREE TIER: Usage Indicator Overlay */}
          {!isPro && messages.filter(m => m.role === 'user').length > 0 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none shadow-lg">
                  {3 - messages.filter(m => m.role === 'user').length} messages remaining
              </div>
          )}
        </div>

        <div className={`
            bg-white transition-all duration-300
            ${isPlanMaximized 
              ? 'fixed inset-0 z-50' 
              : `absolute inset-0 z-20 transform ${activeTab === TabView.PLAN ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:w-[450px] lg:w-[550px] md:z-0 md:border-l md:-ml-[1px]`
            }
        `}>
          <PlanView 
            milestones={milestones} 
            onToggleTask={handleToggleTask} 
            onUpdateMilestone={handleUpdateMilestone}
            isFullScreen={isPlanMaximized}
            onToggleFullScreen={() => setIsPlanMaximized(!isPlanMaximized)}
          />
        </div>
      </main>

      {/* Tab Bar - Mobile Only */}
      <div className="flex md:hidden border-t border-gray-100 bg-white pb-safe">
        <button
          onClick={() => {
              setActiveTab(TabView.CHAT);
              setIsPlanMaximized(false);
          }}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all duration-200 ${
            activeTab === TabView.CHAT 
              ? 'text-black bg-gray-50' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
          }`}
        >
          <MessageSquare size={20} strokeWidth={activeTab === TabView.CHAT ? 2.5 : 2} />
          <span className={`text-[10px] tracking-wide ${activeTab === TabView.CHAT ? 'font-bold' : 'font-medium'}`}>CHAT</span>
        </button>
        
        <button
          onClick={() => setActiveTab(TabView.PLAN)}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all duration-200 relative ${
            activeTab === TabView.PLAN 
              ? 'text-black bg-gray-50' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
          }`}
        >
          {milestones.length > 0 && (
            <span className="absolute top-3 right-[35%] w-2 h-2 bg-black rounded-full" />
          )}
          <ClipboardList size={20} strokeWidth={activeTab === TabView.PLAN ? 2.5 : 2} />
          <span className={`text-[10px] tracking-wide ${activeTab === TabView.PLAN ? 'font-bold' : 'font-medium'}`}>
            ROADMAP
          </span>
        </button>
      </div>
      
      {/* Live Session Overlay */}
      {isLiveSessionActive && activeCoach && (
        <LiveSessionView 
            coach={activeCoach}
            messages={messages}
            onSendMessage={handleSendMessage}
            onEndSession={() => setIsLiveSessionActive(false)}
            isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Delete History?</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        This will permanently delete the current chat session and roadmap plan for <strong>{activeCoach?.name}</strong>. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleResetSession}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <EmailDialog 
        isOpen={isActivationDialogOpen} 
        onClose={() => setIsActivationDialogOpen(false)} 
        onConfirm={handlePlanActivation}
        onLogin={handleAuthLogin}
        user={user}
      />
      
      {/* Global Paywall */}
      <Paywall 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        onSuccess={() => setIsPro(true)} 
      />
    </div>
  );
}
