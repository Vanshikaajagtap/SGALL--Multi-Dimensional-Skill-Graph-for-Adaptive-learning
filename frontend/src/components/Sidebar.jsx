import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 h-screen flex flex-col pt-6 pb-6 px-4" style={{ background: '#111317', borderRight: '1px solid var(--border-color)' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <Logo className="w-8 h-8 text-orange-500" style={{ color: '#FF4B2A' }} />
        <span className="text-xl font-bold tracking-tight" style={{ color: 'white' }}>
          Atlas<span style={{ color: '#FF4B2A' }}>.</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard') ? 'bg-[#1C1F26]' : 'hover:bg-[#1C1F26]/50'}`}
          style={{ color: isActive('/dashboard') ? 'white' : 'var(--text-muted)' }}
        >
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
           <span className="text-sm font-semibold">Dashboard</span>
        </Link>
        <Link 
          to="/graph" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/graph') ? 'bg-[#1C1F26]' : 'hover:bg-[#1C1F26]/50'}`}
          style={{ color: isActive('/graph') ? 'white' : 'var(--text-muted)' }}
        >
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
           <span className="text-sm font-semibold">{isAdmin ? 'Class Explorer' : 'Concept Map'}</span>
        </Link>
        
        {isAdmin && (
          <Link 
            to="/analytics" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/analytics') ? 'bg-[#1C1F26]' : 'hover:bg-[#1C1F26]/50'}`}
            style={{ color: isActive('/analytics') ? 'white' : 'var(--text-muted)' }}
          >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
             <span className="text-sm font-semibold">System Analytics</span>
          </Link>
        )}
      </nav>

      {/* User Section bottom */}
      <div className="mt-auto pt-6 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-3 px-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center font-bold" style={{ color: '#FF4B2A' }}>
            {user?.name?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Instructor' : 'Student'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors hover:bg-red-500/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Log Out
        </button>
      </div>
    </div>
  );
}
