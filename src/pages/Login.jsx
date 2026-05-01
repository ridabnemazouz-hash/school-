import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mauve-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-mauve-100 rounded-2xl flex items-center justify-center mb-4">
            <School className="text-mauve-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your EduSaaS account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all text-sm"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <input id="remember" type="checkbox" className="w-4 h-4 text-mauve-600 border-slate-300 rounded focus:ring-mauve-500" />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600">Remember me</label>
            </div>
            <a href="#" className="text-sm font-medium text-mauve-600 hover:text-mauve-500">Forgot Password?</a>
          </div>
          
          <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p className="mb-4">
            Don't have an account? <a href="/register" className="text-mauve-600 font-medium hover:underline">Sign up</a>
          </p>
          <p>Demo Credentials:</p>
          <p className="mt-1">super@school.com | password</p>
        </div>
      </div>
    </div>
  );
}
