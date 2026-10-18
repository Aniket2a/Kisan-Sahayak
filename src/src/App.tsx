import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ResourceDetailsModal } from './components/ResourceDetailsModal';
import { AdminResourceModal } from './components/AdminResourceModal';
import { ToastContainer } from './components/ToastContainer';
import { BackToTop } from './components/BackToTop';

import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { CropsPage } from './pages/CropsPage';
import { ToolsPage } from './pages/ToolsPage';
import { SchemesPage } from './pages/SchemesPage';
import { LoansPage } from './pages/LoansPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { WeatherPage } from './pages/WeatherPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { CommunityPage } from './pages/CommunityPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const App: React.FC = () => {
  const { currentRoute } = useApp();

  // Ensure page starts at the top and avoid browser restoring scrolled position on reload
  React.useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/dashboard':
        return <DashboardPage />;
      case '/crops':
        return <CropsPage />;
      case '/tools':
        return <ToolsPage />;
      case '/schemes':
        return <SchemesPage />;
      case '/loans':
        return <LoansPage />;
      case '/resources':
        return <ResourcesPage />;
      case '/weather':
        return <WeatherPage />;
      case '/marketplace':
        return <MarketplacePage />;
      case '/community':
        return <CommunityPage />;
      case '/bookmarks':
        return <BookmarksPage />;
      case '/profile':
        return <ProfilePage />;
      case '/admin':
        return <AdminPage />;
      case '/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%' }}>
      <Header />
      <main style={{ flex: 1, width: '100%', minWidth: 0 }}>
        {renderCurrentPage()}
      </main>
      <Footer />

      {/* Global Modals & Notifications */}
      <ResourceDetailsModal />
      <AdminResourceModal />
      <ToastContainer />
      <BackToTop />
    </div>
  );
};
