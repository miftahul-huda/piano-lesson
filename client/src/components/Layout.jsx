import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Music, LayoutDashboard, LogOut, Sun, Moon, Droplets } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass m-4 p-4 flex justify-between items-center sticky top-4 z-50">
                <Link to="/practice" className="flex items-center gap-2 text-2xl font-bold text-primary no-underline">
                    <Music size={32} />
                    <span>PianoMaster</span>
                </Link>
                <nav className="flex items-center gap-6">
                    <Link to="/practice" className="flex items-center gap-1 text-text-main no-underline hover:text-primary transition-colors">
                        Practice
                    </Link>
                    <Link to="/dashboard" className="flex items-center gap-1 text-text-main no-underline hover:text-primary transition-colors">
                        <LayoutDashboard size={18} />
                        History
                    </Link>
                    
                    {/* Theme Switcher */}
                    <div className="flex items-center gap-2 bg-black/10 p-1 rounded-lg">
                        <button onClick={() => setTheme('theme-light')} className={`p-1.5 rounded-md transition-colors ${theme === 'theme-light' ? 'bg-white text-yellow-500 shadow-sm' : 'text-text-muted hover:text-text-main'}`} title="Light Theme">
                            <Sun size={16} />
                        </button>
                        <button onClick={() => setTheme('theme-dark')} className={`p-1.5 rounded-md transition-colors ${theme === 'theme-dark' ? 'bg-slate-800 text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`} title="Dark Theme">
                            <Moon size={16} />
                        </button>
                        <button onClick={() => setTheme('theme-ocean')} className={`p-1.5 rounded-md transition-colors ${theme === 'theme-ocean' ? 'bg-sky-900 text-sky-300 shadow-sm' : 'text-text-muted hover:text-text-main'}`} title="Ocean Theme">
                            <Droplets size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 border-l border-white/10 pl-4 ml-2">
                        {user && (
                            <div className="flex items-center gap-3 text-sm text-text-muted bg-black/10 px-3 py-1.5 rounded-full">
                                {user.picture ? (
                                    <img src={user.picture} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                )}
                                <span className="max-w-[150px] truncate" title={user.name || user.email}>
                                    {user.name || user.email}
                                </span>
                            </div>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg transition-all border-none">
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </nav>
            </header>
            <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
