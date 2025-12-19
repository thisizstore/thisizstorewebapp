import { useState, useEffect } from 'react';
import { Menu, X, LogOut, Gamepad2, Shield, User } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();

  // Logout confirmation modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Detect scroll for navbar style change
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if user is logged in (either from session or cached profile)
  const isLoggedIn = !!(user || profile);

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogout = async () => {
    console.log('[Navbar] Logout clicked');
    setLogoutLoading(true);
    try {
      const result = await signOut();
      console.log('[Navbar] Logout result:', result);
      onPageChange('home');
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
      onPageChange('home');
      setShowLogoutConfirm(false);
    } finally {
      setLogoutLoading(false);
    }
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
    { id: 'home', label: 'Home', icon: null },
    { id: 'tutorial', label: 'Tutorial', icon: null },
    { id: 'jasa-posting', label: 'Jasa Posting', icon: null },
    { id: 'jasa-cari', label: 'Jasa Cari', icon: null },
    { id: 'market', label: 'Market', icon: null },
  ];

  // Add admin page if user is admin
  // Don't check loading - profile is already cached so isAdmin is immediately available
  if (isAdmin) {
    pages.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-black/20'
        : 'bg-gradient-to-b from-slate-950/90 to-transparent backdrop-blur-sm'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-18">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative">
                <Gamepad2 className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                <div className="absolute inset-0 w-8 h-8 bg-cyan-400/30 blur-lg group-hover:bg-cyan-300/40 transition-all duration-300 rounded-full" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  THIS IZ STORE
                </span>
                <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300" />
              </div>
            </button>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavClick(page.id)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${currentPage === page.id
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  <span className="flex items-center gap-1.5">
                    {page.icon && <page.icon className="w-4 h-4" />}
                    {page.label}
                  </span>
                  {currentPage === page.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Auth Buttons / User Info */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {profile?.username || 'User'}
                      </p>
                      {isAdmin && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openLogoutConfirm();
                    }}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/40 cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 pointer-events-none" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="px-5 py-2 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/10 rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-slate-800/50 rounded-xl transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-cyan-400" />
              ) : (
                <Menu className="w-6 h-6 text-cyan-400" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
            <div className="py-4 space-y-2 border-t border-cyan-500/20">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavClick(page.id)}
                  className={`block w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${currentPage === page.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {page.icon && <page.icon className="w-4 h-4" />}
                    {page.label}
                  </span>
                </button>
              ))}

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-cyan-500/20 space-y-2">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-400" />
                        <span className="text-white font-medium">{profile?.username || 'User'}</span>
                        {isAdmin && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openLogoutConfirm();
                      }}
                      className="w-full px-4 py-4 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer min-h-[56px]"
                    >
                      <LogOut className="w-5 h-5 pointer-events-none" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleAuthClick('login');
                        setIsMenuOpen(false);
                      }}
                      className="flex-1 px-4 py-3 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 rounded-xl transition-colors font-medium"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup');
                        setIsMenuOpen(false);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl transition-all font-medium"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={!logoutLoading ? closeLogoutConfirm : undefined}
          />

          {/* Modal */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 w-full max-w-md animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="relative p-6 pb-0">
              {/* Close button */}
              <button
                onClick={closeLogoutConfirm}
                disabled={logoutLoading}
                className="absolute top-4 right-4 p-2 hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-500/20 rounded-2xl">
                  <LogOut className="w-10 h-10 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Keluar dari Akun
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-slate-300 text-center leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun <span className="font-semibold text-cyan-400">{profile?.username || 'User'}</span>?
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={closeLogoutConfirm}
                disabled={logoutLoading}
                className="flex-1 px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl transition-all duration-300 font-medium shadow-lg shadow-red-500/30 hover:shadow-red-500/50 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {logoutLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Keluar...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Ya, Keluar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}