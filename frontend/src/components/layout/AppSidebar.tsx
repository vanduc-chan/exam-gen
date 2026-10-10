import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap as LogoIcon
} from 'lucide-react';
import { SidebarContext } from './MainLayout';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Trang chủ', icon: LayoutDashboard },
  { path: '/departments', label: 'Khoa', icon: Building2 },
  { path: '/department-groups', label: 'Tổ bộ môn', icon: Users },
  { path: '/subjects', label: 'Môn học', icon: BookOpen },
  { path: '/courses', label: 'Đối tượng thi', icon: GraduationCap },
  { path: '/questions', label: 'Câu hỏi', icon: HelpCircle },
  { path: '/exams', label: 'Kỳ thi', icon: FileText },
];

const AppSidebar = () => {
  const { isCollapsed, toggleCollapse, isMobileOpen, setIsMobileOpen } = useContext(SidebarContext);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <LogoIcon className="h-6 w-6" />
            <span>Exam Generator</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out relative flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-lg text-primary truncate">
              <LogoIcon className="h-6 w-6 shrink-0" />
              <span className="truncate">Exam Generator</span>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto text-primary">
              <LogoIcon className="h-6 w-6" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse}
            className="h-8 w-8 rounded-full ml-auto text-muted-foreground hover:text-foreground"
            title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
