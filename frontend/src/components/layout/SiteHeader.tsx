import React from 'react';

const SiteHeader = () => {
  return (
    <header className="h-14 border-b bg-background flex items-center px-6 justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* We can put breadcrumbs or page title here if needed */}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">Administrator</div>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          A
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
