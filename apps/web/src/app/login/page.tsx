'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'TEACHER'>('ADMIN');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    if (!supabase) {
      // In dev mode without Supabase env vars, allow direct entry
      setInfoMsg('Operating in local development mode without live Supabase credentials. Redirecting to Foundry...');
      setTimeout(() => router.push('/'), 800);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: email.split('@')[0],
            },
          },
        });
        if (error) throw error;
        setInfoMsg('Account created! Please check your email for confirmation or sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-chassis text-[#dee2f1] flex flex-col justify-center items-center p-4">
      {/* Background radial calibration grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,229,255,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-1 border border-border-subdued rounded-xl shadow-2xl p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="44" height="44">
              <rect width="40" height="40" rx="8" fill="#111827" />
              <path
                d="M11 9H23L29 15V31H11V9Z"
                stroke="#00E5FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#0c131d"
              />
              <path
                d="M23 9V15H29"
                stroke="#00E5FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M16 19H24" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 23H24" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 27H21" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="28" cy="28" r="3" fill="#00E5FF" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#f1f5f9] tracking-tight">PaperForge Access</h1>
          <p className="text-xs text-[#94a3b8]">
            Singapore-Cambridge A-Level Examination Foundry
          </p>
        </div>

        {/* Info Banner if Supabase not configured */}
        {!supabase && (
          <div className="p-3.5 rounded-lg bg-surface-2 border border-border-active text-xs text-[#cbd5e1] space-y-1">
            <div className="flex items-center gap-1.5 text-primary-cyan font-semibold">
              <Sparkles size={14} />
              <span>Development Mode Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed">
              Supabase env variables are not set yet. You can submit any email or click below to enter directly as Administrator.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded bg-status-error/10 border border-status-error/40 text-xs text-status-error flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded bg-status-approved/10 border border-status-approved/40 text-xs text-status-approved flex items-center gap-2">
            <ShieldCheck size={15} />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#94a3b8] mb-1.5">
              Account Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-[#94a3b8]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adrian.low@paperforge.sg"
                className="w-full bg-surface-2 border border-border-subdued focus:border-primary-cyan rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#f1f5f9] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#94a3b8] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-[#94a3b8]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-2 border border-border-subdued focus:border-primary-cyan rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#f1f5f9] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-mono text-[#94a3b8] mb-1.5">
                Role Assignment
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'TEACHER')}
                className="w-full bg-surface-2 border border-border-subdued rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:outline-none"
              >
                <option value="ADMIN">Administrator (Full Ingestion & Review)</option>
                <option value="TEACHER">Tuition Teacher (Worksheets & Downloads)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-primary-cyan hover:bg-primary-hover text-[#090e18] text-xs font-bold transition-all shadow-cyan-glow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In to Foundry'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-2 border-t border-border-subdued flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#94a3b8] hover:text-primary-cyan transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </button>

          <Link href="/" className="text-primary-cyan hover:underline text-xs">
            Skip to Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
