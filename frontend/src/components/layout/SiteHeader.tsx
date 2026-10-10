import React, { useContext } from 'react';
import { Menu, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarContext } from './MainLayout';

const SiteHeader = () => {
  const { toggleCollapse, toggleMobile } = useContext(SidebarContext);

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 md:px-6 justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Toggle Button for Mobile */}
        <Button variant="ghost" size="icon" onClick={toggleMobile} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Button>

        {/* Toggle Button for Desktop */}
        <Button variant="ghost" size="icon" onClick={toggleCollapse} className="hidden md:flex">
          <PanelLeft className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* <div className="flex items-center gap-4">
        <div className="text-sm font-medium hidden sm:block">Administrator</div>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
          A
        </div>
      </div> */}
    </header>
  );
};

export default SiteHeader;
