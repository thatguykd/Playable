
import React, { useState } from 'react';
import { User, SubscriptionTier } from '../types';
import { User as UserIcon, CreditCard, Shield, Camera, Save, Loader2, Zap, Crown } from 'lucide-react';
import { updateUser } from '../services/storageService';

interface SettingsPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onOpenPricing: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser, onOpenPricing }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'security'>('profile');
  
  // Profile Form
  const [name, setName] = useState(user.name);
  const [avatarSeed, setAvatarSeed] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const updated = await updateUser({
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`
        });
        onUpdateUser(updated);
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-925 p-8">
      <div className="max-w-4xl mx-auto w-full">
         <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
         <p className="text-gray-500 mb-8">Manage your profile, subscription, and security.</p>
         
         <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 flex flex-col gap-2">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <UserIcon size={18} /> Profile
                </button>
                <button 
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <CreditCard size={18} /> Subscription
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <Shield size={18} /> Security
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-8">
                
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
                             <div className="relative group">
                                 <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                                    alt="Avatar" 
                                    className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-800"
                                 />
                                 <button type="button" onClick={() => setAvatarSeed(Math.random().toString(36))} className="absolute bottom-0 right-0 p-2 bg-gray-700 hover:bg-indigo-500 rounded-full text-white border-4 border-gray-900 transition-colors">
                                     <Camera size={16} />
                                 </button>
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-white">Profile Photo</h3>
                                 <p className="text-sm text-gray-500">Click the camera icon to generate a new avatar.</p>
                             </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Display Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                            <input 
                                type="email" 
                                value={user.email}
                                disabled
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Email cannot be changed.</p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}

                {/* BILLING TAB */}
                {activeTab === 'billing' && (
                    <div className="space-y-8">
                        <div className="bg-gray-950 rounded-xl p-6 border border-gray-800 flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 className="text-2xl font-bold text-white capitalize">{user.tier === 'gamedev' ? 'GameDev' : user.tier === 'pro' ? 'Pro Studio' : 'Free Starter'}</h2>
                                    {user.tier === 'gamedev' && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded uppercase">Active</span>}
                                    {user.tier === 'pro' && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded uppercase">Active</span>}
                                </div>
                                <p className="text-sm text-gray-400">
                                    {user.tier === 'free' ? 'Upgrade to unlock more power.' : 'Renews on Nov 14, 2024'}
                                </p>
                            </div>
                            <button 
                                onClick={onOpenPricing}
                                className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                {user.tier === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-950 rounded-xl p-6 border border-gray-800">
                                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                                    <Zap size={20} /> <span className="font-bold text-sm uppercase">Credits</span>
                                </div>
                                <p className="text-3xl font-mono font-bold text-white">{user.credits.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-950 rounded-xl p-6 border border-gray-800">
                                <div className="flex items-center gap-2 mb-2 text-purple-400">
                                    <Crown size={20} /> <span className="font-bold text-sm uppercase">Projects</span>
                                </div>
                                <p className="text-3xl font-mono font-bold text-white">{user.gamesCreated}</p>
                            </div>
                        </div>

                        {user.tier === 'free' && (
                            <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm">
                                <strong>Tip:</strong> Upgrade to GameDev plan to edit your existing games and remove limits.
                            </div>
                        )}
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Current Password</label>
                                    <input type="password" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">New Password</label>
                                    <input type="password" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                                    <input type="password" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">Update Password</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
         </div>
      </div>
    </div>
  );
};
