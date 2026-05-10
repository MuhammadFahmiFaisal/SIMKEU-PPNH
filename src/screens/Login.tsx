import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Lock, Mail, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: loginError } = await login(email, password);
      if (loginError) {
        setError(loginError.message === 'Invalid login credentials' 
          ? 'Email atau password salah.' 
          : loginError.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4 sm:p-8 font-sans">
      
      {/* Animated Background Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" 
      />
      
      {/* Main Glassmorphic Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-6xl bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10"
      >
         
         {/* Left Panel - Brand */}
         <div className="hidden lg:flex lg:flex-col w-full lg:w-5/12 p-10 lg:p-16 justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/50 mix-blend-overlay" />
            
            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center mb-8 shadow-xl"
              >
                <ShieldCheck size={32} className="text-emerald-400" />
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1] mb-6"
              >
                EduPay<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Admin Portal.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-sm"
              >
                Platform manajemen keuangan yang aman, cerdas, dan responsif. Dirancang khusus untuk efisiensi Yayasan Nurul Huda.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative z-10 mt-12 lg:mt-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">SA</div>
                  <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">BD</div>
                  <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">AU</div>
                </div>
                <div className="text-xs font-medium text-slate-400 leading-tight">
                  Akses Terbatas<br/><strong className="text-white tracking-wide uppercase text-[9px]">Hanya untuk staf resmi</strong>
                </div>
              </div>
            </motion.div>
         </div>

         {/* Right Panel - Form */}
         <div className="w-full lg:w-7/12 bg-white p-10 lg:p-16 flex items-center justify-center relative">
            <div className="w-full max-w-md">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Login Sistem</h2>
                  <p className="text-slate-500 font-medium text-sm">Gunakan kredensial Anda untuk masuk.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Alamat Email</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:bg-white transition-all text-slate-900 font-bold text-sm placeholder:text-slate-300 placeholder:font-medium"
                        placeholder="admin@yayasan.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-2 mr-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kata Sandi</label>
                      <button type="button" onClick={() => setError('Fitur pemulihan kata sandi dinonaktifkan sementara. Hubungi Super Admin.')} className="text-[9px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">Lupa?</button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:bg-white transition-all text-slate-900 font-bold text-sm placeholder:text-slate-300 placeholder:font-medium"
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-2"
                      >
                        <div className="px-5 py-4 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm">
                          <AlertCircle size={16} className="shrink-0" />
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:from-slate-800 hover:to-slate-700 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none mt-8 group"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Masuk Sistem
                        <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-12 text-center border-t border-slate-100 pt-8">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">EduPay v2.0</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 tracking-wide">© {new Date().getFullYear()} Yayasan Nurul Huda.</p>
                </div>
              </motion.div>
            </div>
         </div>
      </motion.div>
    </div>
  );
}
