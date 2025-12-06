import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Loader2, Smartphone, Lock } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login/send-code', { phone });
      setPhoneCodeHash(res.data.phoneCodeHash);
      setStep('code');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/login/sign-in', {
        phone,
        code,
        hash: phoneCodeHash,
        initData: window.Telegram?.WebApp?.initData
      });
      onLoginSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-4 bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Connect Telegram</h2>
        
        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="relative">
                <Smartphone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 px-4 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Send Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 px-4 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </button>
            <button 
              onClick={() => setStep('phone')}
              className="w-full text-sm text-gray-400 hover:text-white"
            >
              Back
            </button>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

