import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import GreenTechCanvas from '../components/greentech/GreenTechCanvas';
import TiltCard from '../components/greentech/TiltCard';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result;
      if (mode === 'login') {
        result = await authService.login(form.email, form.password);
      } else {
        result = await authService.register(form.email, form.password, form.username, form.full_name);
      }
      login(result.access_token, result.user);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const result = await authService.demoLogin();
      login(result.access_token, result.user);
      navigate('/app/dashboard');
    } catch {
      setError('Backend not running. Start the API server and try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050806] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <GreenTechCanvas />

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full -z-10" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00FF87] to-emerald-700 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,135,0.4)] group-hover:scale-105 transition-transform duration-300">
              <Leaf className="w-6 h-6 text-[#050806]" />
            </div>
          </Link>
          <h1 className="font-display font-black text-3xl text-white mt-4 tracking-tight">
            {mode === 'login' ? 'ACCESS ECOPULSE' : 'JOIN THE GREEN GRID'}
          </h1>
          <p className="text-emerald-400/80 font-mono text-xs mt-1 uppercase tracking-widest">
            RENEWABLE HABITS • VERIFIED FOOTPRINT
          </p>
        </div>

        <TiltCard className="p-8 border-emerald-500/25">
          {/* Demo Login Button */}
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full btn-neon py-3.5 mb-6 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon"
          >
            {demoLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap size={16} className="fill-black" />
            )}
            <span>CONTINUE AS DEMO USER (INSTANT)</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-500/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0B130E] px-3 text-[11px] font-mono text-emerald-400/60 uppercase">
                OR LOGIN WITH CREDENTIALS
              </span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-black/40 border border-emerald-500/20 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                  mode === m
                    ? 'bg-[#00FF87] text-black shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-mono text-emerald-300 mb-1">FULL NAME</label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Aria Chen"
                    className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF87]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-emerald-300 mb-1">USERNAME</label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    placeholder="ariachen"
                    className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF87]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-mono text-emerald-300 mb-1">CAMPUS EMAIL</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="student@university.edu"
                className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF87]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-emerald-300 mb-1">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FF87]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-outline-neon py-3 mt-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Authenticate' : 'Create Account'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-center gap-2 text-[11px] font-mono text-emerald-400/60">
            <ShieldCheck size={14} className="text-[#00FF87]" />
            <span>256-BIT ENCRYPTED CAMPUS AUTH</span>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
