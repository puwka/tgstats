import { useEffect, useState } from 'react';
import { api } from './lib/api';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'auth' | 'dashboard'>('auth');
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  // Check initData and existing session on mount
  useEffect(() => {
    const init = async () => {
      // Expand WebApp
      window.Telegram?.WebApp?.expand();
      
      // Mock for browser dev if no initData
      if (!window.Telegram?.WebApp?.initData && import.meta.env.DEV) {
        console.warn("No initData found. Running in DEV mode.");
      }

      try {
        // 1. Check if we have a session
        const res = await api.post('/auth/init', {
          initData: window.Telegram?.WebApp?.initData || "query_id=..." 
        });
        
        setUser(res.data.user);

        if (res.data.hasSession) {
          await fetchStats();
        } else {
          setView('auth');
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to initialize. Please open in Telegram.');
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats');
      setStats(res.data.stats);
      setUser(res.data.user); // Update user details from stats if available
      setView('dashboard');
    } catch (e) {
      console.error(e);
      // If stats fail (e.g. session expired), go back to auth
      setView('auth');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400 animate-pulse">Analyzing your year...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {view === 'auth' ? (
        <Auth onLoginSuccess={fetchStats} />
      ) : (
        stats && <Dashboard stats={stats} user={user} />
      )}
    </div>
  );
}

export default App;

