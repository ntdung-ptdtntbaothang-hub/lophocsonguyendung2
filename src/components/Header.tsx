import React, { useState } from 'react';
import { Bell, Search, GraduationCap, Smartphone, ShieldCheck, Download, Upload, RotateCcw, Check, Sparkles, Lock, LogOut } from 'lucide-react';
import { storage } from '../services/storage';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isStudentMode: boolean;
  onToggleStudentMode: () => void;
  onOpenStudentPortal?: () => void;
  unreadCount: number;
  onDataRefresh: () => void;
  isOwner?: boolean;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onTabChange,
  searchQuery,
  onSearchChange,
  isStudentMode,
  onToggleStudentMode,
  onOpenStudentPortal,
  unreadCount,
  onDataRefresh,
  isOwner = false,
  onOpenLoginModal,
  onLogout,
}) => {
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const handleExportBackup = () => {
    const jsonStr = storage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_LopHocSo_CoDung_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Đã tải file sao lưu dữ liệu!');
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = storage.importData(content);
        if (success) {
          onDataRefresh();
          setBackupMsg('Khôi phục dữ liệu thành công!');
        } else {
          setBackupMsg('Lỗi: File dữ liệu không hợp lệ!');
        }
        setTimeout(() => setBackupMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục lại dữ liệu mẫu giáo viên & học sinh lớp 10A-12B ban đầu?')) {
      storage.resetToSampleData();
      onDataRefresh();
      setBackupMsg('Đã đặt lại dữ liệu mẫu!');
      setTimeout(() => setBackupMsg(null), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                    LỚP HỌC SỐ – CÔ GIÁO NGUYỄN THỊ DUNG
                  </h1>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Môn Tin học – Giao nhiệm vụ & trò chơi tương tác THPT
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Search input & Direct Mode switcher */}
          <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm học sinh, nhiệm vụ, bài học, lớp, trò chơi..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-emerald-500 rounded-lg outline-hidden transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Zone 3: Primary Actions & User role toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Authentication status for Owner (Cô Dung) */}
            {isOwner ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold hidden xl:inline">Chủ app: Cô Dung</span>
                  <span className="font-bold xl:hidden">Cô Dung</span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.2 rounded font-semibold hidden md:inline">
                    Đầy đủ quyền
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Đăng xuất quyền chủ tài khoản"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow"
                title="Đăng nhập tài khoản Chủ App để có quyền thêm & sửa"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng Nhập Chủ App</span>
                <span className="sm:hidden">Đăng nhập</span>
              </button>
            )}

            {/* Quick Mode Toggle for Testing Student View */}
            <button
              onClick={onToggleStudentMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isStudentMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
              title="Chuyển đổi góc nhìn của Giáo viên hoặc Học sinh"
            >
              {isStudentMode ? (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Về Giao diện Giáo viên</span>
                  <span className="sm:hidden">Giáo viên</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Xem Giao diện Học sinh</span>
                  <span className="sm:hidden">Học sinh</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            {onOpenStudentPortal && (
              <button
                onClick={onOpenStudentPortal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-all cursor-pointer"
                title="Cổng Tra cứu Tài khoản & Sổ Điểm Học sinh"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Cổng Điểm Học Sinh</span>
              </button>
            )}

            <button
              onClick={() => onTabChange('notifications')}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Thông báo hoạt động mới"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Backup & System Data Menu */}
            <div className="relative">
              <button
                onClick={() => setShowBackupMenu(!showBackupMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Lưu trữ & Khôi phục dữ liệu lâu dài"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </button>

              {showBackupMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
                  <div className="px-2 py-1.5 font-semibold text-slate-800 border-b border-slate-100 mb-1">
                    Lưu trữ & An toàn Dữ liệu
                  </div>
                  <button
                    onClick={() => {
                      handleExportBackup();
                      setShowBackupMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-slate-50 rounded-lg text-slate-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-medium">Xuất dữ liệu sao lưu (.json)</div>
                      <div className="text-[10px] text-slate-400">Lưu bài nộp & nhiệm vụ về máy tính</div>
                    </div>
                  </button>

                  <label className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 rounded-lg text-slate-700 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-medium">Nhập file sao lưu</div>
                      <div className="text-[10px] text-slate-400">Khôi phục dữ liệu từ máy tính</div>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        handleImportBackup(e);
                        setShowBackupMenu(false);
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      handleResetData();
                      setShowBackupMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-rose-50 text-rose-700 rounded-lg cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Đặt lại dữ liệu mẫu</div>
                      <div className="text-[10px] text-rose-500">Nạp lại lớp 10A-12B ban đầu</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Feedback message */}
        {backupMsg && (
          <div className="py-1 px-3 bg-emerald-600 text-white text-xs font-medium flex items-center justify-between rounded-md mb-2">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {backupMsg}
            </span>
            <button onClick={() => setBackupMsg(null)} className="text-emerald-200 hover:text-white">✕</button>
          </div>
        )}
      </div>
    </header>
  );
};
