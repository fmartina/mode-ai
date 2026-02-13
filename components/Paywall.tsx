
import React, { useEffect, useState } from 'react';
import { Check, Star, X, Zap, Loader2, ShieldCheck, BrainCircuit, RefreshCw } from 'lucide-react';
import { revenueCat, Package } from '../services/revenueCatService';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onSuccess }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadOfferings = async () => {
        const pkgs = await revenueCat.getOfferings();
        setPackages(pkgs);
        setLoading(false);
      };
      loadOfferings();
    }
  }, [isOpen]);

  const handlePurchase = async (pkgIdentifier: string) => {
    setPurchasing(pkgIdentifier);
    const success = await revenueCat.purchasePackage(pkgIdentifier);
    if (success) {
      onSuccess();
      onClose();
    }
    setPurchasing(null);
  };

  const handleRestore = async () => {
      setRestoring(true);
      const success = await revenueCat.restorePurchases();
      setRestoring(false);
      
      if (success) {
          alert("Purchases restored successfully!");
          onSuccess();
          onClose();
      } else {
          // If native, the service handles the specific error, but we can give feedback here if no sub found
          // alert("No active subscription found to restore."); 
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Card */}
      <div className="bg-white w-full max-w-lg sm:rounded-3xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-500 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Image/Gradient */}
        <div className="h-32 bg-black flex items-center justify-center relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-purple-900/50" />
            <div className="relative z-10 flex flex-col items-center">
                <span className="text-white font-black text-3xl tracking-tighter">MODE PRO</span>
                <span className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mt-1">Unlock Your Potential</span>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full p-1">
                <X size={20} />
            </button>
        </div>

        <div className="p-8 overflow-y-auto">
            
            {/* Features */}
            <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                    <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 mt-0.5"><Zap size={16} /></div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Unlimited AI Coaching</h4>
                        <p className="text-xs text-gray-500">Remove the 3-message limit. Chat freely with Gemini 1.5.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-purple-50 p-1.5 rounded-lg text-purple-600 mt-0.5"><BrainCircuit size={16} /></div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">System Design</h4>
                        <p className="text-xs text-gray-500">Create custom coaches with unique protocols.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600 mt-0.5"><ShieldCheck size={16} /></div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Active Accountability</h4>
                        <p className="text-xs text-gray-500">Daily automated email check-ins and plan tracking.</p>
                    </div>
                </div>
            </div>

            {/* Pricing Options */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-gray-300" size={24} />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {packages.map((pkg) => {
                         const isAnnual = pkg.packageType === 'ANNUAL';
                         return (
                            <button
                                key={pkg.identifier}
                                onClick={() => handlePurchase(pkg.identifier)}
                                disabled={!!purchasing || restoring}
                                className={`
                                    relative border rounded-2xl p-4 text-left transition-all duration-200
                                    ${isAnnual 
                                        ? 'border-black bg-black text-white hover:shadow-xl shadow-lg' 
                                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                                    }
                                    ${(purchasing || restoring) ? 'opacity-50' : ''}
                                `}
                            >
                                {isAnnual && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                                        Best Value
                                    </span>
                                )}
                                <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">
                                    {pkg.product.title}
                                </div>
                                <div className="text-xl font-bold mb-1">
                                    {pkg.product.priceString}
                                </div>
                                <div className={`text-[10px] leading-tight ${isAnnual ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {isAnnual ? '2 months free' : 'Flexible plan'}
                                </div>
                                
                                {purchasing === pkg.identifier && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl backdrop-blur-[1px]">
                                        <Loader2 className="animate-spin text-white" />
                                    </div>
                                )}
                            </button>
                         );
                    })}
                </div>
            )}
            
            {/* Restore Button (Mandatory for Subscriptions) */}
            <div className="text-center space-y-3">
                <button 
                    onClick={handleRestore}
                    disabled={restoring || !!purchasing}
                    className="text-xs font-bold text-gray-400 hover:text-gray-900 underline decoration-gray-300 underline-offset-4 flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                    {restoring && <Loader2 size={10} className="animate-spin" />}
                    Restore Purchases
                </button>
                
                <p className="text-[10px] text-gray-400">
                    Secure payment via RevenueCat (Google Play). Cancel anytime in Play Store settings.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
