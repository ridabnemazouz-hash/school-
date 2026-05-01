import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { School, User, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student'
  });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Registration failed');
      }
      
      setSubmitted(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Sent!</h2>
          <p className="text-slate-500 mb-6">
            Your registration request has been sent to the Administration. You will be able to log in once they approve your account.
          </p>
          <p className="text-sm text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden py-12">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-mauve-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-mauve-100 rounded-2xl flex items-center justify-center mb-4">
            <School className="text-mauve-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create an Account</h2>
          <p className="text-slate-500 text-sm mt-1">Join EduSaaS today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {['Student', 'Teacher', 'Parent'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({...formData, role})}
                  className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                    formData.role === role 
                      ? 'border-mauve-500 bg-mauve-50 text-mauve-700' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all text-sm"
                required
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all text-sm"
                required
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all text-sm"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-500 transition-all text-sm"
                required
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending Request...
              </span>
            ) : 'Request Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-mauve-600 font-medium hover:text-mauve-700">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
