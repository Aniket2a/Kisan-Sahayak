import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ResetPasswordPage: React.FC = () => {
  const { updatePasswordWithToken, navigate, showToast } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePasswordWithToken(password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. The reset link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-200">
            <i className="fa-solid fa-key"></i>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your new password below to secure your Kisan Sahayak account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Password Reset Successful!</h3>
              <p className="text-sm text-slate-600 mb-6">
                Your password has been updated securely. Redirecting you to login...
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Go to Login Now
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-red-50 p-4 border border-red-200 flex items-start gap-3">
                  <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5 text-base"></i>
                  <div className="text-sm text-red-700 font-medium">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i> Updating Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
