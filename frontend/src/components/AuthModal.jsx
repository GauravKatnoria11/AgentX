import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  ShieldAlert,
  PhoneCall
} from 'lucide-react';
import { loginUser, signupUser, oauthCallback } from '../api';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  isLiveSupabase
} from '../supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onEmergencyClick }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
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
        }, 600);
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
            phone: phone || '+91-98765-43210',
            role: 'patient'
          });
          if (res.success && res.data?.user) {
            registeredUser = res.data.user;
          } else {
            setError(res.detail || res.message || 'Unable to register. Please try again.');
            setLoading(false);
            return;
          }
        }

        setSuccess('Account created successfully! Welcome to Carelink.');
        setTimeout(() => {
          onAuthSuccess(registeredUser);
          onClose();
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSocialLoading('google');
    try {
      if (isLiveSupabase) {
        await signInWithGoogle();
      } else {
        // Mock Google OAuth callback in development
        const mockGoogleUser = {
          id: '55555555-5555-5555-5555-555555555555',
          email: 'gaganjitsingh003@gmail.com',
          full_name: 'Gaganjit Singh',
          role: 'patient',
          phone: '+91-98765-12345',
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          blood_group: 'B+'
        };
        const syncRes = await oauthCallback({
          provider: 'google',
          access_token: 'google-mock-token-xyz',
          email: mockGoogleUser.email,
          full_name: mockGoogleUser.full_name
        });
        const userToSet = syncRes.success && syncRes.data?.user ? syncRes.data.user : mockGoogleUser;
        setSuccess('Signed in with Google successfully!');
        setTimeout(() => {
          onAuthSuccess(userToSet);
          onClose();
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
      setSocialLoading(null);
    }
  };

  return (
    <div className="fullscreen-login-overlay">
      {/* Top Header with Back to Home & High-Priority Emergency SOS */}
      <div className="fullscreen-login-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onClose}
          className="btn-google-outline"
          style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '3px' }}
        >
          <ArrowLeft size={16} /> Back to Carelink
        </button>

        {/* Emergency SOS Quick Button */}
        <button
          type="button"
          onClick={() => {
            if (onEmergencyClick) {
              onEmergencyClick();
            } else {
              window.location.href = 'tel:108';
            }
          }}
          className="btn-google-danger emergency-login-header-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 800,
            borderRadius: '3px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
          }}
        >
          <ShieldAlert size={16} /> EMERGENCY SOS (108 / 112)
        </button>
      </div>

      {/* Centered Google Style Login Box */}
      <div className="google-login-box">
        {/* Brand Icon & Title */}
        <div className="google-login-logo">
          <div className="brand-icon" style={{ width: '40px', height: '40px', borderRadius: '3px' }}>
            <Building2 size={22} />
          </div>
          <h1 className="google-login-title">
            {mode === 'login' ? 'Sign in to Carelink' : 'Create Carelink Account'}
          </h1>
          <p className="google-login-subtitle">
            {mode === 'login'
              ? 'Access hospital bookings, prescriptions, and health records'
              : 'Instant appointment booking and health tracking'}
          </p>
        </div>

        {/* Emergency Fast-Track Card (Skip Login in Critical Moments) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '3px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#fee2e2', padding: '6px', borderRadius: '3px', color: '#dc2626', display: 'flex' }}>
              <PhoneCall size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#991b1b' }}>
                Medical Emergency?
              </div>
              <div style={{ fontSize: '11px', color: '#b91c1c' }}>
                Skip login for 108 ambulance dispatch
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onEmergencyClick) {
                onEmergencyClick();
              } else {
                window.location.href = 'tel:108';
              }
            }}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
            }}
          >
            Launch SOS 🚨
          </button>
        </div>

        {/* Error and Success Alerts */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--google-red-light)',
              color: 'var(--google-red)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: 'var(--google-green-light)',
              color: 'var(--google-green)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={socialLoading !== null}
          className="google-oauth-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{socialLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div className="google-divider">or with email</div>

        {/* Credentials Form */}
        <form onSubmit={handleEmailAuth}>
          {mode === 'signup' && (
            <>
              <div className="google-input-group">
                <label className="google-input-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="google-input-field"
                    style={{ paddingLeft: '38px' }}
                  />
                  <User size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
              </div>

              <div className="google-input-group">
                <label className="google-input-label">Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="+91-98765-43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="google-input-field"
                    style={{ paddingLeft: '38px' }}
                  />
                  <Phone size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                </div>
              </div>
            </>
          )}

          <div className="google-input-group">
            <label className="google-input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="google-input-field"
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            </div>
          </div>

          <div className="google-input-group">
            <label className="google-input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="google-input-field"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
              />
              <Lock size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-light)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* High-Visibility Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-google-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '10px' }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-body)' }}>
          {mode === 'login' ? (
            <div>
              <span>New to Carelink? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                style={{ color: 'var(--primary-blue)', fontWeight: 600 }}
              >
                Create an account
              </button>
            </div>
          ) : (
            <div>
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                style={{ color: 'var(--primary-blue)', fontWeight: 600 }}
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        {/* HIPAA & Security Note */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}
        >
          <ShieldCheck size={14} color="var(--google-green)" />
          <span>Encrypted patient authentication & verified health records</span>
        </div>
      </div>
    </div>
  );
}
