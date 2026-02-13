
import React, { useState, useMemo } from 'react';
import { Coach } from '../types';
import { User } from 'firebase/auth';
import { ArrowRight, Plus, Share2, Search, Zap, LogOut, User as UserIcon, Lock, Trash2 } from 'lucide-react';

interface CoachSelectionProps {
  coaches: Coach[];
  user: User | null;
  onSelect: (coach: Coach) => void;
  onCreate: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void; // UPDATED: Navigates to page instead of opening dialog
  onShare: (coach: Coach) => void;
}

const ModeLogo = () => (
  <div className="flex items-center justify-center gap-4 mb-6 select-none">
    {/* MODE Logo Icon - Geometric M */}
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
      {/* Left Pillar */}
      <rect x="10" y="10" width="6" height="44" stroke="currentColor" strokeWidth="4" fill="none"/>
      {/* Right Pillar */}
      <rect x="48" y="10" width="6" height="44" stroke="currentColor" strokeWidth="4" fill="none"/>
      {/* V Shape */}
      <path d="M16 12L32 38L48 12" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"/>
    </svg>
    <span className="text-6xl font-black tracking-tighter text-black">MODE</span>
  </div>
);

export const CoachSelection: React.FC<CoachSelectionProps> = ({ coaches, user, onSelect, onCreate, onLogin, onLogout, onDeleteAccount, onShare }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = new Set(coaches.map(c => c.category));
    return ['All', ...Array.from(cats)];
  }, [coaches]);

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = 
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      coach.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || coach.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 animate-in fade-in duration-500 pt-12 sm:pt-24 relative">
      
      {/* AUTH Header - Top Right */}
      <div className="absolute top-6 right-6 z-50">
          {!user ? (
              <button 
                onClick={onLogin}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"
              >
                  Sign In
              </button>
          ) : (
              <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 bg-white border border-gray-200 pl-1 pr-3 py-1 rounded-full hover:border-gray-300 transition-all shadow-sm"
                  >
                      {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                              <UserIcon size={16} />
                          </div>
                      )}
                      <span className="text-xs font-medium text-gray-700 hidden sm:block">
                          {user.displayName?.split(' ')[0] || 'User'}
                      </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Signed in as</p>
                              <p className="text-xs font-semibold text-gray-900 truncate">{user.email}</p>
                          </div>
                          <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                             <Zap size={14} className="text-gray-400" /> Subscription: Free
                          </button>
                          
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button 
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    onLogout();
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                            <button 
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    onDeleteAccount();
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors uppercase tracking-wide"
                            >
                                <Trash2 size={12} /> Delete Account
                            </button>
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>

      <div className="max-w-5xl w-full flex-1">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <ModeLogo />
          <p className="text-sm font-medium tracking-[0.2em] text-[#666666] mt-1 uppercase">Switch your mindset.</p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-6 group max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find a coach..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all placeholder-gray-400 shadow-sm"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border
                ${selectedCategory === cat 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Create New Card - Always visible but prompts login if needed */}
          <button
            onClick={onCreate}
            className="group relative flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-300 rounded-2xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300 min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 mb-5 group-hover:scale-110 transition-transform shadow-sm relative">
              <Plus size={28} />
              {!user && (
                 <div className="absolute -top-1 -right-1 bg-black text-white rounded-full p-1 border-2 border-white">
                     <Lock size={10} />
                 </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Coach</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                {user ? "Design your own AI system with custom logic." : "Sign in to design your own AI system."}
            </p>
          </button>

          {/* Existing Coaches */}
          {filteredCoaches.map((coach) => (
            <div
              key={coach.id}
              className="group relative flex flex-col items-start text-left p-8 border border-gray-200 rounded-2xl hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white animate-in fade-in slide-in-from-bottom-2"
            >
               {/* Share Button (Visible on Hover/Focus) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(coach);
                }}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-black hover:bg-gray-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Share this Coach"
              >
                <Share2 size={18} />
              </button>

              <div 
                onClick={() => onSelect(coach)}
                className="w-full flex flex-col items-start cursor-pointer h-full"
              >
                <div className="flex items-start justify-between w-full mb-5">
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-base font-bold group-hover:bg-black group-hover:text-white transition-colors overflow-hidden flex-shrink-0 shadow-sm relative">
                    {coach.icon ? (
                        <span className="text-2xl">{coach.icon}</span>
                    ) : (
                        coach.avatarInitials
                    )}
                    </div>
                    {/* Category Tag */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100/50">
                            {coach.category}
                        </span>
                        {/* Show "My Coach" badge if user is owner */}
                        {user && coach.createdBy === user.uid && (
                             <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-indigo-500 px-1.5 py-0.5 rounded-full">
                                ME
                             </span>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 w-full">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{coach.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">{coach.description}</p>
                  
                  {coach.personality && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg self-start w-fit uppercase tracking-wide">
                        <Zap size={12} className="text-gray-400" />
                        <span className="truncate max-w-[200px]">{coach.personality}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex items-center text-sm font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                  Start Session <ArrowRight size={16} className="ml-2" />
                </div>
              </div>
            </div>
          ))}
          
          {filteredCoaches.length === 0 && (
             <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 opacity-50">
                <p className="text-base text-gray-400">
                    No coaches found {selectedCategory !== 'All' ? `in '${selectedCategory}'` : ''} matching "{searchQuery}"
                </p>
             </div>
          )}
        </div>
      </div>
      
      {/* Privacy Policy Footer */}
      <div className="mt-12 mb-2 text-center opacity-40 hover:opacity-100 transition-opacity">
         <a 
           href="https://privacypolicyurl.com/mode/privacy-policy.html"
           target="_blank"
           rel="noopener noreferrer"
           className="text-[9px] font-medium text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest border-b border-transparent hover:border-gray-300 pb-0.5"
         >
           Privacy Policy
         </a>
      </div>
    </div>
  );
};
