
import React, { useState } from 'react';
import { X, ArrowRight, Loader2, Lock, CheckCircle, Mail } from 'lucide-react';
import { User } from 'firebase/auth';

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onLogin: () => Promise<void>;
  user: User | null;
}

export const EmailDialog: React.FC<EmailDialogProps> = ({ isOpen, onClose, onConfirm, onLogin, user }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  const handleLogin = async () => {
    // Triggers the google popup from App.tsx
    await onLogin();
    // After login, the 'user' prop will update, automatically switching the UI below
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            {user ? 'Confirm Activation' : 'Account Required'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-8">
          {!user ? (
            // GUEST STATE: Ask to Login
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <Lock size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Save Your System</h4>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  To activate this roadmap and receive your daily check-ins, please sign in to sync your account.
                </p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>Sign In with Google</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            // LOGGED IN STATE: Ask for Confirmation
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100">
                <Mail size={32} />
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Ready to Launch?</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We will activate this plan and send the roadmap to:
                </p>
                <div className="mt-3 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg inline-block">
                    <span className="text-sm font-semibold text-gray-900">{user.email}</span>
                </div>
              </div>

              <div className="w-full space-y-3 pt-2">
                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                    {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                    ) : (
                    <>
                        <span>Yes, Activate Plan</span>
                        <CheckCircle size={16} />
                    </>
                    )}
                </button>
                <button 
                    onClick={onClose}
                    disabled={loading}
                    className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                    No, keep editing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
