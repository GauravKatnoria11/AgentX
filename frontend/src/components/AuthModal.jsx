import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { loginUser, signupUser, oauthCallback } from '../api';
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  isLiveSupabase,
  SUPABASE_CALLBACK_URL
} from '../supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'facebook' | null
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        let authenticatedUser = null;

        // 1. Try Supabase Auth if live
        if (isLiveSupabase) {
          try {
            const data = await signInWithEmail(email, password);
            if (data?.session) {
              const su = data.session.user;
              const syncRes = await oauthCallback({
                provider: 'email',
                access_token: data.session.access_token,
                email: su.email,
                full_name: su.user_metadata?.full_name || su.email.split('@')[0]
              });
              if (syncRes.success && syncRes.data?.user) {
                authenticatedUser = syncRes.data.user;
              }
            }
          } catch (sbErr) {
            console.warn('Supabase email login notice:', sbErr.message);
          }
        }

        // 2. Fallback to backend authentication
        if (!authenticatedUser) {
          const res = await loginUser(email, password);
          if (res.success && res.data?.user) {
            authenticatedUser = res.data.user;
          } else {
            setError(res.detail || res.message || 'Invalid email or password.');
            setLoading(false);
            return;
          }
        }

        setSuccess('Signed in successfully! Welcome back.');
        setTimeout(() => {
          onAuthSuccess(authenticatedUser);
          onClose();
        }, 700);
      } else {
        // Sign Up
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        let registeredUser = null;

        // 1. Try Supabase signup if live
        if (isLiveSupabase) {
          try {
            const data = await signUpWithEmail(email, password, {
              full_name: fullName,
              phone: phone || null
            });
            if (data?.session?.user) {
              const su = data.session.user;
              const syncRes = await oauthCallback({
                provider: 'email',
                access_token: data.session.access_token,
                email: su.email,
                full_name: fullName
              });
              if (syncRes.success && syncRes.data?.user) {
                registeredUser = syncRes.data.user;
              }
            }
          } catch (sbErr) {
            console.warn('Supabase signup notice:', sbErr.message);
          }
        }

        // 2. Fallback to backend signup
        if (!registeredUser) {
          const res = await signupUser({
            email,
            password,
            full_name: fullName,
            phone: phone || null,
            role: 'patient'
          });
          if (res.success && res.data?.user) {
            registeredUser = res.data.user;
          } else {
            setError(res.detail || res.message || 'Signup failed. Please try again.');
            setLoading(false);
            return;
          }
        }

        setSuccess('Account created successfully! Welcome to Carelink.');
        setTimeout(() => {
          onAuthSuccess(registeredUser);
          onClose();
        }, 700);
      }
    } catch (err) {
      console.error(err);
      setError('Authentication error. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setSuccess('');
    setSocialLoading('google');
    try {
      await signInWithGoogle();
      // Supabase redirects to accounts.google.com
    } catch (err) {
      console.error('Google OAuth error:', err);
      if (err.message && err.message.includes('redirect_uri_mismatch')) {
        setError(`Google Redirect URI Mismatch: Add ${SUPABASE_CALLBACK_URL} to Authorized redirect URIs in Google Cloud Console.`);
      } else {
        setError(err.message || 'Could not connect to Google OAuth.');
      }
      setSocialLoading(null);
    }
  };

  const handleFacebookAuth = async () => {
    setError('');
    setSuccess('');
    setSocialLoading('facebook');
    try {
      await signInWithFacebook();
      // Supabase redirects to facebook.com
    } catch (err) {
      console.error('Facebook OAuth error:', err);
      setError(err.message || 'Could not connect to Facebook OAuth.');
      setSocialLoading(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 25, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0e172a',
          border: '1px solid #334155',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          color: '#ffffff',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#2563eb', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> HIPAA Compliant
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 2px', color: '#ffffff' }}>
              {mode === 'login' ? 'Welcome to Carelink' : 'Create Patient Account'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              {mode === 'login'
                ? 'Sign in to access your appointments & medical records'
                : 'Join the accredited Hoshiarpur healthcare network'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0b1222' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: mode === 'login' ? '#1e293b' : 'transparent',
              color: mode === 'login' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: mode === 'login' ? '2px solid #38bdf8' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: mode === 'signup' ? '#1e293b' : 'transparent',
              color: mode === 'signup' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: mode === 'signup' ? '2px solid #38bdf8' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        <div style={{ padding: '22px 26px', maxHeight: '78vh', overflowY: 'auto' }}>
          {/* Alerts */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#fca5a5', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', color: '#86efac', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          {/* Social Logins (Google + Facebook) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={socialLoading !== null}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#1e293b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{socialLoading === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Facebook OAuth Button */}
            <button
              type="button"
              onClick={handleFacebookAuth}
              disabled={socialLoading !== null}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#1877F2',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{socialLoading === 'facebook' ? 'Redirecting to Facebook...' : 'Continue with Facebook'}</span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
            <span>Or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gaganjit Singh"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        background: '#090e1c',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Mobile Phone (Optional, for OTP & SMS reminders)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      placeholder="+91-98765-43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        background: '#090e1c',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    background: '#090e1c',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Password {mode === 'signup' && <span style={{ color: '#64748b', fontWeight: 400 }}>(min. 6 characters)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    background: '#090e1c',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In with Email' : 'Create My Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
