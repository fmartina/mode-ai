
export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  type?: 'action' | 'habit'; // 'action' = one-time, 'habit' = recurring system
  resource?: {
    title: string;
    url: string;
  };
}

export interface Milestone {
  id: string;
  title: string;
  timeframe: string; // e.g., "Week 1", "Phase 1"
  description?: string; // Optional context
  notes?: string; // User added notes/reflections
  tasks: Task[];
  isCompleted: boolean; // Computed
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isEmailPrompt?: boolean; // Identifies if this message is asking for email confirmation
}

export interface Coach {
  id: string;
  name: string;
  description: string;
  category: string;
  personality?: string;
  systemInstruction: string;
  avatarInitials: string;
  icon?: string;
  greeting?: string;
  // Firebase Fields
  createdBy?: string; // UID of the user who created it
  isPublic?: boolean; // If true, visible to community
  createdAt?: number; // Timestamp
}

export enum TabView {
  CHAT = 'CHAT',
  PLAN = 'PLAN',
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  subscriptionTier: 'free' | 'pro';
}

// NEW: Data Architecture for Plan Persistence & Automation
export interface ActivePlan {
  user_id: string;
  email: string;
  name: string;
  coach_persona: string;
  goal: string;
  status: 'active' | 'completed' | 'archived';
  system_habit: string; // The critical daily routine
  roadmap: Milestone[]; // The full JSON structure
  email_opt_in: boolean;
  start_date: any; // Firestore Timestamp
}

// NEW: Session Persistence (Auto-save state)
export interface Session {
  id: string;
  userId: string;
  coachId: string;
  messages: Message[];
  milestones: Milestone[];
  lastUpdated: any; // Timestamp
}
