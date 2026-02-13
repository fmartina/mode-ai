import React, { useEffect, useRef, useState } from 'react';
import { Coach, Message } from '../types';
import { Mic, MicOff, PhoneOff, User } from 'lucide-react';

interface LiveSessionViewProps {
  coach: Coach;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onEndSession: () => void;
  isLoading: boolean;
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({ 
  coach, 
  messages, 
  onSendMessage, 
  onEndSession,
  isLoading 
}) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [status, setStatus] = useState<'Listening' | 'Speaking' | 'Thinking' | 'Idle'>('Idle');
  
  const recognitionRef = useRef<any>(null);
  const lastProcessedMessageId = useRef<string | null>(null);

  // 1. Handle Text-To-Speech (Coach Voice) - Auto-play logic
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    // Only speak if it's a NEW message from the model
    if (lastMsg.role === 'model' && lastMsg.id !== lastProcessedMessageId.current) {
      lastProcessedMessageId.current = lastMsg.id;
      setStatus('Speaking');
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lastMsg.text);
      
      // Select voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        setStatus('Idle');
        // Optional: Auto-start listening after speaking
        if (isMicOn) startListening();
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [messages, isMicOn]);

  // 2. Handle Speech Recognition (Input)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Don't listen if already waiting for response or speaking
    if (isLoading || status === 'Speaking') return;

    try {
        if (recognitionRef.current) recognitionRef.current.stop();
    } catch(e) {}

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setStatus('Listening');
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onSendMessage(transcript);
        setStatus('Thinking');
      }
    };

    recognition.onend = () => {
       if (status === 'Listening') setStatus('Idle'); 
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleMic = () => {
    if (isMicOn) {
        setIsMicOn(false);
        try { recognitionRef.current?.stop(); } catch(e) {}
        setStatus('Idle');
    } else {
        setIsMicOn(true);
        startListening();
    }
  };

  // 3. Initial Greeting Trigger
  useEffect(() => {
     const lastMsg = messages[messages.length - 1];
     if (lastMsg?.role === 'model') {
         // Could trigger speech here if needed on mount
     }
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col animate-in fade-in duration-500 font-sans">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs font-medium tracking-wider">LIVE AUDIO</span>
            </div>
        </div>
        
        {/* User Avatar Representation (Replaces Camera PIP) */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 transition-opacity duration-300 ${status === 'Listening' ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className={`w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 relative z-10 transition-transform ${status === 'Listening' ? 'scale-110' : 'scale-100'}`}>
                <User size={24} />
            </div>
            
            <div className="absolute bottom-2 text-[10px] font-bold text-gray-500 tracking-wider uppercase">You</div>

            {/* Mic Status Indicator inside Avatar Box */}
            {!isMicOn && (
                <div className="absolute top-2 right-2 bg-red-500/90 p-1 rounded-full shadow-sm">
                    <MicOff size={10} className="text-white" />
                </div>
            )}
            {isMicOn && status === 'Listening' && (
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />
            )}
        </div>
      </div>

      {/* Main Stage (Coach) */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">
        
        {/* Ambient Glow */}
        {status === 'Speaking' && (
            <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
        )}

        {/* Coach Avatar Container */}
        <div className="relative z-10 flex flex-col items-center">
            
            {/* The Avatar Circle */}
            <div className={`
                relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center text-8xl shadow-2xl transition-all duration-700 ease-in-out
                ${status === 'Speaking' ? 'scale-110 shadow-indigo-500/30' : 'scale-100 shadow-black/50'}
            `}>
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full border border-white/10" />
                
                {/* Icon */}
                <span className="relative z-10 drop-shadow-2xl filter saturate-150">{coach.icon || coach.avatarInitials}</span>
                
                {/* Active Speaking Rings */}
                {status === 'Speaking' && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    </>
                )}
                
                {/* Listening/Thinking States */}
                {status === 'Listening' && (
                     <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
                )}
                {status === 'Thinking' && (
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
                )}
            </div>

            {/* Information Block */}
            <div className="mt-10 text-center space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tight">{coach.name}</h2>
                <div className="flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                        status === 'Speaking' ? 'bg-indigo-400' :
                        status === 'Listening' ? 'bg-emerald-400' :
                        status === 'Thinking' ? 'bg-purple-400' : 'bg-gray-600'
                    }`} />
                    <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                        {status === 'Speaking' ? 'Speaking' : 
                        status === 'Listening' ? 'Listening' : 
                        status === 'Thinking' ? 'Processing' : 'Connected'}
                    </p>
                </div>
            </div>

        </div>

        {/* Live Transcriptions */}
        {messages.length > 0 && (
            <div className="mt-12 max-w-2xl w-full text-center">
                <p className={`text-xl md:text-2xl font-medium leading-relaxed transition-opacity duration-500 ${
                    status === 'Speaking' ? 'text-white opacity-100' : 'text-gray-400 opacity-60'
                }`}>
                    "{messages[messages.length - 1].text}"
                </p>
            </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-t border-white/5 p-8 flex justify-center items-center gap-8 z-20 pb-safe">
        
        <button 
            onClick={toggleMic}
            className={`p-5 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isMicOn 
                ? 'bg-gray-800 text-white hover:bg-gray-700 ring-1 ring-white/10' 
                : 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20'
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
            {isMicOn ? <Mic size={28} /> : <MicOff size={28} />}
        </button>

        <button 
            onClick={onEndSession}
            className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-red-600/40 transition-all transform hover:scale-105 flex items-center gap-3"
        >
            <PhoneOff size={28} />
            <span className="hidden sm:inline">End Session</span>
        </button>

      </div>
    </div>
  );
};