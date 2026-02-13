import React, { useState, useRef, useEffect } from 'react';
import { Message, Coach } from '../types';
import { Send, Sparkles, User, Mic, MicOff, Volume2, StopCircle, Video } from 'lucide-react';

interface ChatViewProps {
  messages: Message[];
  coach: Coach;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStartLiveSession: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, coach, onSendMessage, isLoading, onStartLiveSession }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- SPEECH RECOGNITION (Input) ---
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition. Try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- TEXT TO SPEECH (Output) ---
  const toggleSpeech = (text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any previous speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }

    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* HEADER for Chat View - Now includes Video Call Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm border border-gray-100">
                {coach.icon || coach.avatarInitials}
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm">{coach.name}</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Online</span>
                </div>
            </div>
         </div>
         
         <button 
            onClick={onStartLiveSession}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
         >
            <Video size={14} />
            <span>Live Call</span>
         </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 text-3xl">
              {coach.icon || coach.avatarInitials}
            </div>
            <h2 className="text-lg font-semibold mb-2">Hello. I'm {coach.name}.</h2>
            <p className="text-gray-500 text-sm max-w-xs">{coach.description}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full group ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`flex max-w-[85%] sm:max-w-[75%] gap-3 items-end ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs border mb-1 ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white border-transparent' 
                  : 'bg-white text-gray-900 border-gray-200'
              }`}>
                {msg.role === 'user' ? (
                  <User size={14} />
                ) : (
                  <span className="font-semibold text-sm">{coach.icon || coach.avatarInitials}</span>
                )}
              </div>

              {/* Bubble */}
              <div
                className={`relative px-4 py-3 text-sm rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm group-hover:shadow-md transition-shadow ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}
              >
                {msg.text}

                {/* TTS Button (Only for Model) */}
                {msg.role === 'model' && (
                    <button
                        onClick={() => toggleSpeech(msg.text, msg.id)}
                        className={`absolute -right-8 bottom-0 p-1.5 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 ${speakingMessageId === msg.id ? 'opacity-100 text-indigo-500 bg-indigo-50' : ''}`}
                        title="Read aloud"
                    >
                        {speakingMessageId === msg.id ? <StopCircle size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full animate-in fade-in">
             <div className="flex max-w-[75%] gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white text-gray-900 border border-gray-200 text-xs">
                <span className="font-semibold text-sm">{coach.icon || coach.avatarInitials}</span>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto flex items-end gap-2">
          
          <div className="relative flex-1">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : `Message ${coach.name}...`}
                className={`w-full pl-5 pr-12 py-3.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder-gray-400 ${isListening ? 'border-red-300 ring-2 ring-red-50 bg-red-50/20' : 'border-gray-200 focus:border-gray-400'}`}
            />
            
            {/* Mic Button Inside Input */}
            <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isListening 
                    ? 'text-red-500 bg-red-100 hover:bg-red-200 animate-pulse' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title="Dictate message"
            >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-black transition-all flex-shrink-0 shadow-sm"
          >
            {isLoading ? <Sparkles size={18} className="animate-pulse text-indigo-400" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};