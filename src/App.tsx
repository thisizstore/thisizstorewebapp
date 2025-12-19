import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Tutorial } from './pages/Tutorial';
import { JasaPosting } from './pages/JasaPosting';
import { JasaCari } from './pages/JasaCari';
import { Market } from './pages/Market';
import { Admin } from './pages/Admin';
import { prefetchMarketData, prefetchAdminData } from './hooks/useDataStore';
import { useAuth } from './hooks/useAuth';

type PageType = 'home' | 'tutorial' | 'jasa-posting' | 'jasa-cari' | 'market' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const { isAdmin } = useAuth();

  // Prefetch market data on app load for faster navigation
  // Data is already loaded from cache, this triggers a background refresh
  useEffect(() => {
    // Prefetch immediately in the background to refresh cache
    prefetchMarketData();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'tutorial':
        return <Tutorial />;
      case 'jasa-posting':
        return <JasaPosting />;
      case 'jasa-cari':
        return <JasaCari />;
      case 'market':
        return <Market />;
      case 'admin':
        return <Admin />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;

