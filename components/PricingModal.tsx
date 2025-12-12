
import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import { User, SubscriptionTier } from '../types';
import { createCheckoutSession, STRIPE_PRICE_IDS } from '../services/stripeClient';

interface PricingModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (user: User) => void;
  requiredAction?: 'upgrade' | 'refill';
}

export const PricingModal: React.FC<PricingModalProps> = ({ user, onClose, onUpdateUser, requiredAction }) => {
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [loadingRefill, setLoadingRefill] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (user.tier === tier) return;
    setLoadingTier(tier);
    setError(null);

    try {
      // Get the appropriate Stripe price ID
      const priceId = tier === 'gamedev'
        ? STRIPE_PRICE_IDS.gamedev_monthly
        : STRIPE_PRICE_IDS.pro_monthly;

      // Redirect to Stripe checkout
      await createCheckoutSession(priceId, 'subscription');
      // User will be redirected to Stripe, so we won't reach here
    } catch (e: any) {
      console.error('Stripe checkout error:', e);
      setError(e.message || 'Failed to start checkout. Please try again.');
      setLoadingTier(null);
    }
  };

  const handleRefill = async () => {
    setLoadingRefill(true);
    setError(null);

    try {
      // Redirect to Stripe checkout for one-time payment
      await createCheckoutSession(STRIPE_PRICE_IDS.fuel_pack, 'payment');
      // User will be redirected to Stripe, so we won't reach here
    } catch (e: any) {
      console.error('Stripe checkout error:', e);
      setError(e.message || 'Failed to start checkout. Please try again.');
      setLoadingRefill(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-gray-925 border border-gray-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="p-8 text-center border-b border-gray-800 bg-gray-900 relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-3xl font-bold text-white mb-2">Upgrade Your Studio</h2>
            <p className="text-gray-400">Unlock more generations, faster speeds, and pro tools.</p>
         </div>

         <div className="flex-1 overflow-y-auto p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* FREE TIER */}
                <div className={`relative p-6 rounded-xl border ${user.tier === 'free' ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-900 border-gray-800'} flex flex-col`}>
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-white">Starter</h3>
                        <p className="text-gray-500 text-sm">Testing Period - Try Everything!</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-3xl font-bold text-white">Free</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-green-500"/> 1 Game Project</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-green-500"/> 10,000 Initial Credits <span className="text-xs text-purple-400">(Testing Bonus!)</span></li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-green-500"/> Basic Models</li>
                        <li className="flex items-center gap-2 text-sm text-gray-500"><span className="w-4 h-4 block">✕</span> No Iterations</li>
                    </ul>
                    <button 
                        disabled={true}
                        className="w-full py-3 rounded-lg font-bold bg-gray-800 text-gray-500 cursor-not-allowed"
                    >
                        {user.tier === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                </div>

                {/* GAMEDEV TIER */}
                <div className={`relative p-6 rounded-xl border ${user.tier === 'gamedev' ? 'bg-indigo-900/10 border-indigo-500 ring-1 ring-indigo-500' : 'bg-gray-900 border-gray-700'} flex flex-col transform hover:scale-105 transition-all shadow-xl`}>
                    {user.tier === 'gamedev' && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">ACTIVE</div>}
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-indigo-400" />
                            <h3 className="text-xl font-bold text-white">GameDev</h3>
                        </div>
                        <p className="text-gray-500 text-sm">For creators</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-3xl font-bold text-white">$9</span><span className="text-gray-500">/mo</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-indigo-500"/> Unlimited Projects</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-indigo-500"/> 2,500 Credits / mo</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-indigo-500"/> Edit & Iterate Games</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-indigo-500"/> Priority Queue</li>
                    </ul>
                    <button 
                        onClick={() => handleUpgrade('gamedev')}
                        disabled={user.tier === 'gamedev' || !!loadingTier}
                        className={`w-full py-3 rounded-lg font-bold transition-all ${user.tier === 'gamedev' ? 'bg-gray-800 text-gray-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
                    >
                        {loadingTier === 'gamedev' ? <Loader2 className="animate-spin mx-auto"/> : (user.tier === 'gamedev' ? 'Active' : 'Upgrade')}
                    </button>
                </div>

                {/* PRO TIER */}
                <div className={`relative p-6 rounded-xl border ${user.tier === 'pro' ? 'bg-purple-900/10 border-purple-500 ring-1 ring-purple-500' : 'bg-gray-900 border-gray-700'} flex flex-col`}>
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                             <Crown size={20} className="text-purple-400" />
                             <h3 className="text-xl font-bold text-white">Pro Studio</h3>
                        </div>
                        <p className="text-gray-500 text-sm">For power users</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-3xl font-bold text-white">$29</span><span className="text-gray-500">/mo</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-purple-500"/> Everything in GameDev</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-purple-500"/> 15,000 Credits / mo</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-purple-500"/> Fastest Generation</li>
                        <li className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-purple-500"/> Early Access Features</li>
                    </ul>
                    <button 
                        onClick={() => handleUpgrade('pro')}
                        disabled={user.tier === 'pro' || !!loadingTier}
                        className={`w-full py-3 rounded-lg font-bold transition-all ${user.tier === 'pro' ? 'bg-gray-800 text-gray-400' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'}`}
                    >
                        {loadingTier === 'pro' ? <Loader2 className="animate-spin mx-auto"/> : (user.tier === 'pro' ? 'Active' : 'Upgrade')}
                    </button>
                </div>
            </div>

            {/* Credit Top Up */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Fuel Pack</h3>
                    <p className="text-sm text-gray-400">Running low? Add more credits without changing your plan.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">1,000 Credits</p>
                        <p className="text-sm text-gray-500">$5.00 One-time</p>
                    </div>
                    <button 
                        onClick={handleRefill}
                        disabled={loadingRefill}
                        className="px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {loadingRefill ? <Loader2 className="animate-spin"/> : 'Buy Now'}
                    </button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
