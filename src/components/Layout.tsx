import React, { ReactNode } from 'react';
import NavBar from './NavBar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-blue-900 to-dark">
      <NavBar />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
};

export default Layout; 