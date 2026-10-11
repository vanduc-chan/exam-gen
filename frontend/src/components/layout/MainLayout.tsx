import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import SiteHeader from './SiteHeader';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const SidebarContext = React.createContext<{
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}>({
  isCollapsed: false,
  toggleCollapse: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  toggleMobile: () => {},
});

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(prev => !prev);
  const toggleMobile = () => setIsMobileOpen(prev => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile,
      }}
    >
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <SiteHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-900 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default MainLayout;
