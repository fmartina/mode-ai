
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { deleteUserAccount } from '../services/firebase';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    if (confirmationText !== 'DELETE') return;
    
    setLoading(true);
    setError(null);

    try {
      await deleteUserAccount(user);
      onClose();
      onLogout(); // Force logout/reset app state
      window.location.reload(); // Hard reload to clear any cached states
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
          setError("Security Update: Please sign out and sign in again before deleting your account.");
      } else {
          setError("Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <h3 className="font-bold uppercase tracking-wide text-sm">Delete Account</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-red-300 hover:text-red-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            You are about to permanently delete your account, including all:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1 mb-6">
            <li>Roadmaps and Action Plans</li>
            <li>Custom Coaches created by you</li>
            <li>Chat history and sessions</li>
            <li>Subscription status</li>
          </ul>

          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6">
            <p className="text-xs font-bold text-red-800">
              ⚠️ This action cannot be undone.
            </p>
          </div>

          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Type "DELETE" to confirm
          </label>
          <input 
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="DELETE"
            disabled={loading}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all mb-4"
          />

          {error && (
             <p className="text-xs text-red-600 font-medium mb-4">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmationText !== 'DELETE' || loading}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
