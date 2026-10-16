import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.js';
import { Footer } from '../components/Footer.js';

/**
 * PublicLayout
 * Exclusively owns the Public / Landing Website Navigation (<Navbar />)
 * and Public Footer (<Footer />) for public visitor routes.
 * Student Portal Navigation (<PortalHeader />) must NEVER be rendered here.
 */
export const PublicLayout: React.FC = () => {
  return (
    <div
      className="public-layout-shell"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--paper, #eceee6)',
        overflow: 'visible',
      }}
    >
      <Navbar />
      <main style={{ flex: 1, width: '100%', overflow: 'visible' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;

