'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, ShieldAlert, User } from 'lucide-react';
import { ALLOWED_ADMIN_EMAIL } from '@paperforge/shared';
import { createClient } from '../../lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'TEACHER'>('TEACHER');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  const supabase = createClient();
  const isSupabaseConfigured = Boolean(supabase);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        'Supabase Authentication is required to log in. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    // Role guard: Only designated admin email can register as ADMIN
    if (isSignUp && role === 'ADMIN') {
      const allowedAdmin = (process.env.ADMIN_DEFAULT_EMAIL || ALLOWED_ADMIN_EMAIL).toLowerCase();
      if (email.trim().toLowerCase() !== allowedAdmin) {
        setErrorMsg(`Administrator role is restricted. Only ${allowedAdmin} is authorized as system administrator.`);
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              role,
              full_name: fullName.trim() || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        if (data?.session) {
          router.push(redirectTo);
          router.refresh();
        } else {
          setInfoMsg('Account created successfully! Please check your email inbox to verify your account before signing in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
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

          <h1 className="text-2xl font-bold text-[#f1f5f9] tracking-tight">PaperForge Authentication</h1>
          <p className="text-xs text-[#94a3b8]">
            Singapore-Cambridge A-Level Examination Foundry
          </p>
        </div>

        {/* Configuration Notice if Supabase not connected */}
        {!isSupabaseConfigured && (
          <div className="p-4 rounded-lg bg-surface-2 border border-border-subdued space-y-3">
            <div className="flex items-center gap-1.5 text-primary-cyan font-semibold text-xs">
              <ShieldAlert size={15} />
              <span>Supabase Not Yet Configured in .env.local</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#94a3b8]">
              To connect real cloud authentication, add your credentials to <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">apps/web/.env.local</code>.
            </p>
            <div className="pt-2.5 border-t border-border-subdued space-y-2">
              <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                Local Offline Development & Testing
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = 'paperforge_dev_role=ADMIN; path=/; max-age=86400; SameSite=Lax';
                    window.location.href = redirectTo;
                  }}
                  className="w-full py-2 px-3 rounded bg-primary-cyan text-[#090e18] text-xs font-semibold hover:bg-primary-hover shadow-cyan-glow transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={13} />
                  <span>Enter as Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = 'paperforge_dev_role=TEACHER; path=/; max-age=86400; SameSite=Lax';
                    window.location.href = redirectTo;
                  }}
                  className="w-full py-2 px-3 rounded bg-surface-3 text-[#f1f5f9] text-xs font-semibold hover:bg-surface-2 border border-border-subdued transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <User size={13} />
                  <span>Enter as Teacher</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {urlError === 'supabase_not_configured' && isSupabaseConfigured && (
          <div className="p-3 rounded bg-status-warning/10 border border-status-warning/40 text-xs text-status-warning flex items-center gap-2">
            <AlertCircle size={15} />
            <span>Please authenticate with your Supabase account to access PaperForge resources.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded bg-status-error/10 border border-status-error/40 text-xs text-status-error flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded bg-status-approved/10 border border-status-approved/40 text-xs text-status-approved flex items-center gap-2">
            <ShieldCheck size={15} className="flex-shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-mono text-[#94a3b8] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-[#94a3b8]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Tan"
                  className="w-full bg-surface-2 border border-border-subdued focus:border-primary-cyan rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#f1f5f9] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

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
                placeholder="teacher@institution.edu.sg"
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
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'TEACHER')}
                className="w-full bg-surface-2 border border-border-subdued rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:outline-none"
              >
                <option value="TEACHER">Tuition Teacher (Worksheets & Question Bank)</option>
                <option value="ADMIN">Administrator (Ingestion, Review & Full Access)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full mt-2 py-2.5 rounded-lg bg-primary-cyan hover:bg-primary-hover text-[#090e18] text-xs font-bold transition-all shadow-cyan-glow flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>
              {loading
                ? 'Authenticating...'
                : !isSupabaseConfigured
                ? 'Supabase Configuration Required'
                : isSignUp
                ? 'Create Verified Account'
                : 'Sign In via Supabase Auth'}
            </span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-2 border-t border-border-subdued flex items-center justify-center text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className="text-[#94a3b8] hover:text-primary-cyan transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Register as Educator'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-chassis" />}>
      <LoginForm />
    </Suspense>
  );
}
