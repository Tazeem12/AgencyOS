'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Lock,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { isValidEmail } from '@/lib/validation';

type AuthStep = 'email' | 'otp';

const OTP_LENGTH = 6;
const OTP_TIMEOUT = 60;

export function AdvancedAuth() {
  const { loginWithOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const goBack = () => {
    setStep('email');
    setOtp('');
    setError('');
    setSuccess('');
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithOtp(email.trim().toLowerCase());
      if (result.success) {
        setSuccess('Verification code sent to your email');
        setStep('otp');
        setResendCountdown(OTP_TIMEOUT);
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Verification code is required');
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      setError(`Verification code must be ${OTP_LENGTH} digits`);
      return;
    }
    if (!/^\d+$/.test(otp)) {
      setError('Verification code must contain only numbers');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email, otp);
      if (result.success) {
        setSuccess('Successfully logged in!');
      } else {
        setError(result.error || 'Invalid verification code');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setResendCountdown(OTP_TIMEOUT);

    try {
      const result = await loginWithOtp(email.trim().toLowerCase());
      if (result.success) {
        setSuccess('Verification code resent to your email');
      } else {
        setError(result.error || 'Failed to resend verification code');
      }
    } catch {
      setError('Failed to resend verification code');
    }
  };

  const handleOtpChange = (value: string) => {
    const filtered = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(filtered);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--app-bg)] px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-indigo-900/20">
            <Sparkles className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Agency Tool
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            {step === 'email'
              ? 'Sign in with your email verification code'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-slate-300 bg-white pl-11 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900/20"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm text-emerald-800">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-slate-900 font-medium text-white hover:bg-slate-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <button
                type="button"
                onClick={goBack}
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    maxLength={OTP_LENGTH}
                    className="h-14 border-slate-300 bg-white pl-11 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:ring-slate-900/20"
                    disabled={loading}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm text-emerald-800">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || otp.length !== OTP_LENGTH}
                className="h-12 w-full bg-slate-900 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <div className="text-center">
                {resendCountdown > 0 ? (
                  <p className="text-sm text-slate-500">
                    Resend code in {resendCountdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Didn&apos;t receive the code? Resend
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Internal operations | Secure passwordless access
        </p>
      </div>
    </div>
  );
}
