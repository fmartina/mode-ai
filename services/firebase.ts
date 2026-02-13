
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, deleteUser, User, reauthenticateWithPopup, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, serverTimestamp, Timestamp, deleteDoc, increment, updateDoc, writeBatch } from "firebase/firestore/lite";
import { Coach, UserProfile, Milestone, ActivePlan, Session, Message } from "../types";
import { sendWelcomeWebhook, triggerPlanWebhook } from "./n8nService";

// Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-BBB57HFL2J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Force Persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Persistence error:", error);
});

// --- HELPER: USER ACTIVITY TRACKING ---
export const trackUserActivity = async (userId: string, isPlanInteraction: boolean = false) => {
  try {
    const userRef = doc(db, "users", userId);
    const updates: any = {
      lastActiveAt: serverTimestamp(), 
    };

    if (isPlanInteraction) {
      updates.lastPlanInteractionAt = serverTimestamp(); 
    }

    await setDoc(userRef, updates, { merge: true });
  } catch (e) {
    console.warn("Failed to track user activity", e);
  }
};

// --- AUTH SERVICES ---

const handlePostLogin = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // NEW USER
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        subscriptionTier: 'free',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        plansCreatedCount: 0,
        emailPreferences: { weeklyDigest: true, promotional: true },
        emailStats: { lastDigestSentWeek: null }
      });

      await sendWelcomeWebhook({
        email: user.email,
        displayName: user.displayName,
        uid: user.uid
      });
    } else {
      // RETURNING USER
      await setDoc(userRef, {
        lastLogin: Date.now(),
        lastActiveAt: serverTimestamp() 
      }, { merge: true });
    }
};

export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  try {
    // We STRICTLY use signInWithPopup. 
    // In Capacitor apps, avoid signInWithRedirect as it causes "missing initial state" errors due to storage partitioning.
    const result = await signInWithPopup(auth, provider);
    await handlePostLogin(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);

    // Provide clear debugging for the specific mobile issues
    if (error.code === 'auth/unauthorized-domain') {
       alert("Setup Error: This domain (localhost/capacitor) is not authorized in Firebase Console.");
    } else if (error.code === 'auth/popup-closed-by-user') {
       // User just closed it, no need to panic
    } else {
       alert(`Login Failed: ${error.message}`);
    }
    return null;
  }
};

// Check if user returned from a redirect login (Legacy/Fallback handler)
export const checkRedirect = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            await handlePostLogin(result.user);
            return result.user;
        }
    } catch (error: any) {
        // CRITICAL FIX: Ignore "missing initial state" error.
        // This error crashes the flow but simply means the redirect failed. We should let the app load as "logged out".
        if (error.code === 'auth/missing-initial-state') {
           console.warn("Recovering from failed redirect state (known Capacitor issue).");
           return null;
        }
        console.error("Redirect result error", error);
    }
    return null;
};

export const logout = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

// --- DELETE ACCOUNT ---
export const deleteUserAccount = async (user: User) => {
  try {
    const userId = user.uid;
    console.log("⚠️ Starting account deletion for:", userId);

    // 1. Delete Sessions
    const sessionsQ = query(collection(db, "sessions"), where("userId", "==", userId));
    const sessionsSnap = await getDocs(sessionsQ);
    sessionsSnap.forEach(doc => deleteDoc(doc.ref)); 

    // 2. Delete Active Plans
    const plansQ = query(collection(db, "active_plans"), where("user_id", "==", userId));
    const plansSnap = await getDocs(plansQ);
    plansSnap.forEach(doc => deleteDoc(doc.ref));

    // 3. Delete Draft Plans
    const draftsQ = query(collection(db, "draft_plans"), where("userId", "==", userId));
    const draftsSnap = await getDocs(draftsQ);
    draftsSnap.forEach(doc => deleteDoc(doc.ref));

    // 4. Delete Custom Coaches created by user
    const coachesQ = query(collection(db, "coaches"), where("createdBy", "==", userId));
    const coachesSnap = await getDocs(coachesQ);
    coachesSnap.forEach(doc => deleteDoc(doc.ref));

    // 5. Delete User Profile
    await deleteDoc(doc(db, "users", userId));

    // 6. Delete Auth User
    try {
        await deleteUser(user);
    } catch (authError: any) {
        if (authError.code === 'auth/requires-recent-login') {
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider);
            await deleteUser(user);
        } else {
            throw authError;
        }
    }

    console.log("✅ User account deleted successfully");
    return true;

  } catch (error) {
    console.error("❌ Error deleting user account:", error);
    throw error;
  }
};

// --- SESSION PERSISTENCE ---

const getSessionDocId = (userId: string, coachId: string) => `${userId}_${coachId}`;

export const fetchLastSession = async (userId: string, coachId: string): Promise<Session | null> => {
  try {
    const docId = getSessionDocId(userId, coachId);
    const sessionRef = doc(db, "sessions", docId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      
      const messages = (sessionData.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp)
      }));

      let milestones: Milestone[] = [];
      try {
          const planSnap = await getDoc(doc(db, "draft_plans", docId));
          if (planSnap.exists()) {
              milestones = planSnap.data().milestones || [];
          }
      } catch (err) {
          console.warn("Could not fetch draft plan, defaulting to empty", err);
          milestones = [];
      }

      trackUserActivity(userId, false);

      return {
        id: docId,
        userId: userId,
        coachId: coachId,
        messages: messages,
        milestones: milestones,
        lastUpdated: sessionData.lastUpdated
      } as Session;
    }
    return null;
  } catch (e) {
    console.error("Error fetching session:", e);
    return null;
  }
};

export const saveSession = async (
  userId: string,
  coachId: string,
  messages: Message[],
  milestones: Milestone[]
) => {
  try {
    const docId = getSessionDocId(userId, coachId);
    const sessionRef = doc(db, "sessions", docId);
    const planRef = doc(db, "draft_plans", docId);

    const sanitizedMilestones = JSON.parse(JSON.stringify(milestones));

    await Promise.all([
        setDoc(sessionRef, {
            userId,
            coachId,
            messages,
            lastUpdated: serverTimestamp()
        }, { merge: true }),
        
        setDoc(planRef, {
            userId,
            coachId,
            milestones: sanitizedMilestones,
            lastUpdated: serverTimestamp()
        }, { merge: true })
    ]);

    trackUserActivity(userId, true); 

  } catch (e) {
    console.error("❌ Error auto-saving session:", e);
  }
};

export const deleteSession = async (userId: string, coachId: string) => {
  try {
    const docId = getSessionDocId(userId, coachId);
    await Promise.all([
        deleteDoc(doc(db, "sessions", docId)),
        deleteDoc(doc(db, "draft_plans", docId))
    ]);
    trackUserActivity(userId, false);
    console.log("✅ Session & Plan Deleted");
  } catch (e) {
    console.error("❌ Error deleting session:", e);
    throw e;
  }
};

// --- ACTIVE PLAN SERVICES ---

export const saveAndActivatePlan = async (
  user: User, 
  coachName: string, 
  goal: string,
  milestones: Milestone[], 
  emailOptIn: boolean,
  providedEmail?: string 
) => {
  try {
    const sanitizedRoadmap = JSON.parse(JSON.stringify(milestones));

    let systemHabit = "Daily execution session";
    for (const m of sanitizedRoadmap) {
        const habitTask = m.tasks.find((t: any) => t.type === 'habit');
        if (habitTask) {
            systemHabit = habitTask.text;
            break;
        }
    }

    const planData: Omit<ActivePlan, 'id'> = {
      user_id: user.uid,
      email: providedEmail || user.email || "",
      name: user.displayName || "Creator",
      coach_persona: coachName,
      goal: goal || "Goal Achievement",
      status: 'active',
      system_habit: systemHabit,
      roadmap: sanitizedRoadmap,
      email_opt_in: emailOptIn,
      start_date: serverTimestamp()
    };

    await addDoc(collection(db, "active_plans"), planData);
    console.log("✅ Plan saved to Firestore 'active_plans'");

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
        lastPlanCreatedAt: serverTimestamp(), 
        lastActiveAt: serverTimestamp(),
        lastPlanInteractionAt: serverTimestamp(),
        plansCreatedCount: increment(1) 
    }, { merge: true });

    if (emailOptIn) {
       await triggerPlanWebhook({
         ...planData,
         start_date: new Date().toISOString()
       });
    }

    return true;
  } catch (e) {
    console.error("❌ Error activating plan:", e);
    throw e;
  }
};

export const saveCoachToFirestore = async (coach: Coach, user: User) => {
  try {
    const docRef = await addDoc(collection(db, "coaches"), {
      ...coach,
      createdBy: user.uid,
      creatorName: user.displayName || 'Anonymous',
      isPublic: true,
      createdAt: Date.now()
    });
    trackUserActivity(user.uid, false);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export const fetchCommunityCoaches = async (): Promise<Coach[]> => {
  try {
    const q = query(
      collection(db, "coaches"), 
      where("isPublic", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const coaches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
    return coaches.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e: any) {
    console.error("Error fetching community coaches:", e);
    return [];
  }
};

export const fetchMyCoaches = async (userId: string): Promise<Coach[]> => {
  try {
    const q = query(
      collection(db, "coaches"), 
      where("createdBy", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const coaches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
    return coaches.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.error("Error fetching my coaches:", e);
    return [];
  }
};
