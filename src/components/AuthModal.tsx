import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validatePhoneNumber, validatePasswordStrength, generateCaptcha } from '../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const { signUp, signIn } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Set mode sesuai initialMode ketika modal dibuka
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      setMessage('');
      setFormData({ username: '', phone: '', password: '', confirmPassword: '' });
    }
  }, [isOpen, initialMode]);

  // Reset captcha ketika mode berubah
  useEffect(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setMessage('');
  }, [mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (captchaInput !== captcha) {
      setMessageType('error');
      setMessage('Captcha salah!');
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!formData.username.trim()) {
          throw new Error('Username harus diisi');
        }
        if (!validatePhoneNumber(formData.phone)) {
          throw new Error('Nomor WhatsApp tidak valid');
        }
        if (!validatePasswordStrength(formData.password)) {
          throw new Error('Password minimal 6 karakter');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Password tidak sama');
        }

        const result = await signUp(
          formData.username,
          formData.password,
          formData.phone
        );

        if (result.success) {
          setMessageType('success');
          setMessage('Sign up berhasil! Anda bisa langsung login.');
          setTimeout(() => {
            setMode('login');
            setFormData({ username: '', phone: '', password: '', confirmPassword: '' });
            setCaptcha(generateCaptcha());
            setCaptchaInput('');
          }, 2000);
        } else {
          throw result.error || new Error('Sign up gagal');
        }
      } else {
        if (!formData.username) {
          throw new Error('Username atau nomor WhatsApp harus diisi');
        }
        if (!formData.password) {
          throw new Error('Password harus diisi');
        }

        console.log('[AuthModal] Attempting login with:', formData.username);
        const result = await signIn(formData.username, formData.password);

        if (result.success) {
          console.log('[AuthModal] Login success');
          setMessageType('success');
          setMessage('Login berhasil!');
          setTimeout(() => {
            console.log('[AuthModal] Closing modal');
            onClose();
            setFormData({ username: '', phone: '', password: '', confirmPassword: '' });
            setCaptcha(generateCaptcha());
            setCaptchaInput('');
          }, 1500); // Increased timeout to allow state updates
        } else {
          throw result.error || new Error('Login gagal');
        }
      }
    } catch (error: any) {
      setMessageType('error');
      setMessage(error?.message || 'Terjadi kesalahan');
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div className="relative z-10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-cyan-500/20 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-cyan-300">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username/Nomor */}
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                {mode === 'signup' ? 'Username' : 'Username atau Nomor WhatsApp'}
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={mode === 'signup' ? 'username_anda' : 'username atau 0812...'}
                className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
                disabled={loading}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812345678"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-colors pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Masukkan ulang password"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-colors"
                  disabled={loading}
                />
              </div>
            )}

            {/* Captcha */}
            <div className="space-y-2 bg-slate-800/50 p-4 rounded-lg border border-cyan-500/10">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-cyan-300">Captcha</label>
                <button
                  type="button"
                  onClick={() => setCaptcha(generateCaptcha())}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="bg-slate-900 border border-cyan-500/20 rounded p-3 font-mono text-2xl font-bold text-cyan-400 text-center tracking-widest select-none">
                {captcha}
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                placeholder="Masukkan kode"
                maxLength={4}
                className="w-full px-4 py-2 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-colors text-center font-mono text-lg tracking-widest"
                disabled={loading}
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  messageType === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}
              >
                {messageType === 'success' ? (
                  <Check className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 text-sm cursor-pointer active:from-cyan-400 active:to-cyan-300"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Sign Up'}
            </button>

            {/* Toggle Mode */}
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-slate-400">
                {mode === 'login' ? "Belum punya akun?" : "Sudah punya akun?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setMessage('');
                  setFormData({ username: '', phone: '', password: '', confirmPassword: '' });
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}