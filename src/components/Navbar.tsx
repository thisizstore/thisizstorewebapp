import { useState } from 'react';
import { Menu, X, LogOut, Gamepad2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { user, profile, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onPageChange('home');
    setIsMenuOpen(false);
  };

  const handleNavClick = (page: string) => {
    onPageChange(page);
    setIsMenuOpen(false);
  };

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'jasa-posting', label: 'Jasa Posting' },
    { id: 'jasa-cari', label: 'Jasa Cari' },
    { id: 'market', label: 'Market' },
  ];

  if (isAdmin) {
    pages.push({ id: 'admin', label: 'Admin' });
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-950 via-slate-900 to-transparent border-b border-cyan-500/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 group"
            >
              <Gamepad2 className="w-8 h-8 text-cyan-400 group-hover:text-purple-400 transition-colors" />
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 hidden sm:inline">
                THIS IZ STORE
              </span>
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavClick(page.id)}
                  className={`text-sm font-medium transition-all duration-200 relative ${
                    currentPage === page.id
                      ? 'text-cyan-400'
                      : 'text-slate-300 hover:text-cyan-400'
                  }`}
                >
                  {page.label}
                  {currentPage === page.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-400">
                      {profile?.username || 'User'}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-purple-400 font-bold">ADMIN</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="px-4 py-2 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors duration-200 font-medium text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg transition-all duration-200 font-medium text-sm"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-cyan-400" />
              ) : (
                <Menu className="w-6 h-6 text-cyan-400" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-cyan-500/20 py-4 space-y-3">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavClick(page.id)}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === page.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-slate-300 hover:bg-cyan-500/10'
                  }`}
                >
                  {page.label}
                </button>
              ))}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      handleAuthClick('login');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10 rounded-lg transition-colors font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      handleAuthClick('signup');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg transition-all font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />
    </>
  );
}
