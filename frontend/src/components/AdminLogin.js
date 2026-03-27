import { useState } from 'react';
import axios from 'axios';
import { Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      
      if (response.data.success) {
        toast.success('Login successful!');
        onLogin(response.data.token);
        navigate('/admin/dashboard');
      } else {
        toast.error(response.data.message || 'Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden" data-testid="admin-login-page">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1675335808065-82852cc9744d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwzfHxjbGVhbiUyMGNpdHklMjBwYXJrJTIwd2l0aCUyMHJlY3ljbGluZyUyMGJpbnxlbnwwfHx8fDE3Njg0MDc1OTR8MA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4A7C59] rounded-2xl mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
            <p className="text-gray-600 text-sm">Dustbin Management System</p>
            <p className="text-xs text-gray-500 mt-2">Secure access for administrators only</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 rounded-xl px-4 py-3 transition-all outline-none"
                data-testid="admin-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A7C59] hover:bg-[#3A6346] text-white rounded-full px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="admin-login-submit-button"
            >
              {loading ? 'Logging in...' : 'Access Admin Panel'}
            </button>
          </form>

          {/* Helper Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Default password: <span className="font-mono font-semibold text-gray-700">admin123</span>
            </p>
          </div>
        </div>
        
        {/* Info Box */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Admin portal URL: <span className="font-mono text-gray-700">/admin/login</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;