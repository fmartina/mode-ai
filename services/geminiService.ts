
import { GoogleGenAI } from "@google/genai";
import { Message, Milestone } from "../types";


// Vite env (debe empezar con VITE_)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("⚠️ Missing VITE_GEMINI_API_KEY. Set it in .env.local");
}

const ai = new GoogleGenAI({ apiKey });

// ARCHITECTURAL UPGRADE: "The System + The Roadmap"
// We now force the model to think in "Macro Phases" (Roadmap) and "Micro Habits" (System).
const HIGH_STANDARDS_DIRECTIVE = `
[GLOBAL ARCHITECTURE PROTOCOL]
MISSION: You are an expert Productivity Architect. Your goal is NOT just to list tasks. It is to install a SYSTEM.
The user needs clarity on WHERE they are going (Roadmap) and HOW to get there daily (System).

[OUTPUT FORMAT INSTRUCTION]
You must ALWAYS reply with a valid JSON object. Do not output raw markdown text outside the JSON.
Structure:
{
  "chat_response": "Your conversational reply here (brief, punchy, validating the vision).",
  "email_prompt": "A short, ONE-SENTENCE question strictly in your persona/tone asking if the user wants this roadmap sent to their email for accountability. ONLY include this if 'roadmap.generated' is true. If false, leave empty.",
  "roadmap": {
    "generated": boolean, // Set to true ONLY if you are proposing or updating a full plan.
    "milestones": [
      {
        "timeframe": "e.g. Phase 1 (Foundation)",
        "title": "The name of this phase",
        "tasks": [
            {
                "text": "Specific actionable task",
                "type": "action", // 'action' for one-off tasks, 'habit' for recurring systems.
                "resource": { "title": "Search: Topic", "url": "https://..." } // OPTIONAL
            }
        ]
      }
    ]
  }
}

[ROADMAP DESIGN RULES - THE "SYSTEM" APPROACH]
1. **THE ROADMAP (MACRO):** Break the journey into 3 distinct Phases (e.g., Phase 1: Foundation, Phase 2: Content Engine, Phase 3: Launch).
2. **THE SYSTEM (MICRO):** In Phase 1, you MUST include at least one "Recurring Habit".
   - This is the engine. It is not something you check off once. It is a ritual.
   - Set "type": "habit".
   - Example: "Write for 45 mins every morning at 8 AM."
3. **IMMEDIATE ACTION:** Phase 1 must also include 2-3 "Setup Actions" (One-off) to unblock the user immediately.
4. **RESOURCES:** 
   - ALWAYS generate SEARCH QUERY URLs. 
   - For YouTube: "https://www.youtube.com/results?search_query=[Insert+Topic+Here]"
   - For Google: "https://www.google.com/search?q=[Insert+Topic+Here]"

[COMPLEXITY LOGIC]
- **Goal:** "Write a book"
  -> **Bad Plan:** "Chapter 1, Chapter 2..."
  -> **Good System:** 
     - Habit: "Write 500 words daily at 7 AM" (Type: habit)
     - Action: "Create Outline" (Type: action)
     - Action: "Setup Scrivener" (Type: action)

If the user is just chatting, set "roadmap.generated" to false.
`;

interface GeminiResponse {
  chat_response: string;
  email_prompt?: string;
  roadmap?: {
    generated: boolean;
    milestones: {
      timeframe: string;
      title: string;
      tasks: {
        text: string;
        type?: 'action' | 'habit';
        resource?: { title: string; url: string };
      }[];
    }[];
  };
}

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  systemInstruction: string
): Promise<{ text: string; milestones?: Milestone[]; emailPrompt?: string }> => {
  try {
    const model = 'gemini-2.5-flash'; // Using Flash for speed/JSON reliability

    const chatHistory = history
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

    const combinedInstruction = `${HIGH_STANDARDS_DIRECTIVE}\n\n[SPECIFIC COACH PERSONA]\n${systemInstruction}`;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: combinedInstruction,
        responseMimeType: 'application/json', // Force JSON mode
      },
      history: chatHistory,
    });

    const result = await chat.sendMessage({ message: newMessage });
    const rawText = result.text || "{}";
    
    // Parse the JSON response
    let parsed: GeminiResponse;
    try {
        parsed = JSON.parse(rawText);
    } catch (e) {
        console.error("JSON Parse Error", e);
        return { text: "I'm having trouble structuring the plan right now. Could you try rephrasing?" };
    }

    let structuredMilestones: Milestone[] | undefined = undefined;

    if (parsed.roadmap?.generated && parsed.roadmap.milestones.length > 0) {
        structuredMilestones = parsed.roadmap.milestones.map((m, index) => ({
            id: `milestone-${Date.now()}-${index}`,
            title: m.title,
            timeframe: m.timeframe,
            isCompleted: false,
            tasks: m.tasks.map((t, tIndex) => ({
                id: `task-${Date.now()}-${index}-${tIndex}`,
                text: t.text,
                isCompleted: false,
                type: t.type || 'action', // Default to action if model forgets
                resource: t.resource 
            }))
        }));
    }

    return {
        text: parsed.chat_response,
        milestones: structuredMilestones,
        emailPrompt: parsed.email_prompt
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I seem to be offline. Please check your connection." };
  }
};
