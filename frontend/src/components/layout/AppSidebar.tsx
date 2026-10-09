import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  FileText 
} from 'lucide-react';

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
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
      <div className="h-14 flex items-center px-4 border-b font-semibold text-lg">
        Exam Generator
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
