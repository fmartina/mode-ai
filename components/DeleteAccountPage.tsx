
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Trash2, AlertTriangle, CheckCircle, Lock, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { deleteUserAccount } from '../services/firebase';

interface DeleteAccountPageProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onBack?: () => void; // Optional: Only used when navigating from inside app
}

export const DeleteAccountPage: React.FC<DeleteAccountPageProps> = ({ user, onLogin, onLogout, onBack }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      await deleteUserAccount(user);
      setIsDeleted(true);
      onLogout();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError("Security Requirement: Please Sign Out and Sign In again to verify your identity before deletion.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isDeleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Deleted</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your account and all associated data have been permanently removed from our systems.
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-12 sm:pt-24 p-6 font-sans relative">
      
      {/* Back Button (Only if onBack is provided) */}
      {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
          >
              <X size={24} />
          </button>
      )}

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg">
                <Trash2 size={20} />
            </div>
            <span className="text-xl font-black tracking-tight">MODE</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Request</h1>
        <p className="text-gray-500 text-sm">Compliance with Google Play User Data Policy</p>
      </div>

      <div className="max-w-2xl w-full bg-white sm:border sm:border-gray-200 sm:shadow-lg sm:rounded-2xl overflow-hidden">
        
        {/* Policy Information Block */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">What happens when you delete your account?</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            This action is <strong>permanent and irreversible</strong>. In accordance with our privacy policy and data retention standards, the following data associated with your account will be immediately deleted:
          </p>
          
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              "Personal Profile (Name, Email, ID)",
              "All Chat History & Session Logs",
              "Custom Coaches & Personas",
              "Active Roadmaps & Action Plans",
              "Subscription Records (App Access)",
              "Usage Metrics & Metadata"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <ShieldAlert size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Area */}
        <div className="p-8 bg-gray-50/50">
          {!user ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verify Your Identity</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                To prevent unauthorized deletion, you must sign in to the account you wish to delete.
              </p>
              <button 
                onClick={onLogin}
                className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg mx-auto"
              >
                Sign In with Google <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex items-center gap-3">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full" />
                    )}
                    <div className="text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase">Authenticated As</p>
                        <p className="text-sm font-bold text-gray-900">{user.email}</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-xs text-indigo-600 font-semibold hover:underline">
                    Sign Out
                </button>
              </div>

              {!isConfirming ? (
                 <button 
                    onClick={() => setIsConfirming(true)}
                    className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                 >
                    <Trash2 size={18} /> Request Account Deletion
                 </button>
              ) : (
                 <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-red-800 text-sm">Final Confirmation</h4>
                                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                                    Are you absolutely sure? This cannot be undone. All your AI coaches and chat history will be lost forever.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {error && (
                        <p className="text-xs text-red-600 font-bold mb-3 text-center bg-red-50 p-2 rounded">{error}</p>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsConfirming(false)}
                            disabled={loading}
                            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-lg disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Yes, Delete Everything"}
                        </button>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">
                Data deletion requests are processed immediately. Backup systems may take up to 30 days to clear.
                <br />
                <a href="mailto:support@mode.app" className="underline hover:text-gray-600">Contact Support</a> if you have issues.
            </p>
        </div>
      </div>
    </div>
  );
};
