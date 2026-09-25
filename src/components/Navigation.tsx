import React from 'react';
import { LayoutDashboard, Users, GraduationCap, BookOpen, Inbox, Gamepad2, Trophy, BarChart3, Bell } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  unreadCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  unreadCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'classes', label: 'Lớp học', icon: Users },
    { id: 'students', label: 'Học sinh & Điểm số', icon: GraduationCap },
    { id: 'tasks', label: 'Nhiệm vụ', icon: BookOpen },
    { id: 'submissions', label: 'Kho bài nộp', icon: Inbox },
    { id: 'games', label: 'Trò chơi', icon: Gamepad2 },
    { id: 'results', label: 'Kết quả & Vinh danh', icon: Trophy },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
    { id: 'notifications', label: 'Hoạt động mới', icon: Bell, badge: unreadCount },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer relative shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
