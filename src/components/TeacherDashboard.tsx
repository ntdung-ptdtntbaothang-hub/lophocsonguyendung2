import React from 'react';
import { Classroom, Task, Submission, Game, GameResult } from '../types';
import { 
  PlusCircle, 
  Inbox, 
  Gamepad2, 
  BarChart3, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ExternalLink,
  QrCode,
  FileText,
  Award,
  Sparkles,
  Lock
} from 'lucide-react';

interface TeacherDashboardProps {
  classes: Classroom[];
  tasks: Task[];
  submissions: Submission[];
  games: Game[];
  gameResults: GameResult[];
  onNavigate: (tab: string, param?: string) => void;
  onOpenCreateTask: () => void;
  onOpenCreateGame: () => void;
  onShowQR: (type: 'task' | 'game' | 'class', id: string, title: string, subtitle?: string) => void;
  onOpenSubmissionPreview: (submission: Submission) => void;
  isOwner?: boolean;
  onRequestLogin?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classes,
  tasks,
  submissions,
  games,
  gameResults,
  onNavigate,
  onOpenCreateTask,
  onOpenCreateGame,
  onShowQR,
  onOpenSubmissionPreview,
  isOwner = false,
  onRequestLogin,
}) => {
  const unreviewedCount = submissions.filter(s => s.status === 'submitted').length;
  const totalSubmissions = submissions.length;
  const totalGamePlays = games.reduce((acc, g) => acc + (g.playCount || 0), 0) + gameResults.length;
  const activeTasksCount = tasks.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner & Quick Action Center */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background geometry */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Không gian lớp học số THPT • Bộ môn Tin học</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold mt-1 tracking-tight text-white">
                Xin chào Cô giáo Nguyễn Thị Dung! 👋
              </h2>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Cô giáo dạy môn Tin học – Quản lý nhiệm vụ số, thực hành lập trình & công nghệ, thu nộp bài và trò chơi củng cố kiến thức.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-200 bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống sẵn sàng: 6 lớp THPT (10A – 12B)</span>
            </div>
          </div>

          {/* 4 Big Action Buttons as requested */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <button
              onClick={() => {
                if (!isOwner) {
                  if (onRequestLogin) onRequestLogin();
                  return;
                }
                onOpenCreateTask();
              }}
              className="flex items-center gap-3 p-4 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-left group cursor-pointer border border-emerald-400/30"
              title={isOwner ? "Tạo nhiệm vụ học tập mới" : "Đăng nhập chủ tài khoản để tạo nhiệm vụ"}
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {isOwner ? <PlusCircle className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-amber-300" />}
              </div>
              <div>
                <div className="text-sm font-bold leading-snug">📝 TẠO NHIỆM VỤ</div>
                <div className="text-[11px] text-emerald-100 mt-0.5">Xuất link & mã QR nộp bài</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('submissions')}
              className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 backdrop-blur border border-white/15 text-left group cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Inbox className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="text-sm font-bold leading-snug">📥 XEM BÀI NỘP</div>
                <div className="text-[11px] text-teal-100 mt-0.5">
                  {unreviewedCount > 0 ? `${unreviewedCount} bài mới chưa xem` : 'Xem toàn bộ bài làm'}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                if (!isOwner) {
                  if (onRequestLogin) onRequestLogin();
                  return;
                }
                onOpenCreateGame();
              }}
              className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 backdrop-blur border border-white/15 text-left group cursor-pointer hover:-translate-y-0.5"
              title={isOwner ? "Tạo trò chơi mới" : "Đăng nhập chủ tài khoản để tạo trò chơi"}
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {isOwner ? <Gamepad2 className="w-6 h-6 text-amber-300" /> : <Lock className="w-6 h-6 text-amber-300" />}
              </div>
              <div>
                <div className="text-sm font-bold leading-snug">🎮 TẠO TRÒ CHƠI</div>
                <div className="text-[11px] text-amber-100 mt-0.5">Trắc nghiệm, nối từ, sắp xếp</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('results')}
              className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 backdrop-blur border border-white/15 text-left group cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="text-sm font-bold leading-snug">📊 XEM KẾT QUẢ</div>
                <div className="text-[11px] text-purple-100 mt-0.5">Xếp hạng & Bảng TOP 5</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Statistics Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tổng số lớp</div>
          <div className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
            {classes.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">10A đến 12B</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Nhiệm vụ đang mở</div>
          <div className="text-2xl font-bold font-display text-emerald-700 mt-1 tabular-nums">
            {activeTasksCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{tasks.length} tổng nhiệm vụ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tổng số bài đã nộp</div>
          <div className="text-2xl font-bold font-display text-blue-700 mt-1 tabular-nums">
            {totalSubmissions}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Từ học sinh các khối</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Bài chưa xem</div>
          <div className="text-2xl font-bold font-display text-amber-600 mt-1 tabular-nums">
            {unreviewedCount}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Cần cô kiểm tra</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Trò chơi củng cố</div>
          <div className="text-2xl font-bold font-display text-purple-700 mt-1 tabular-nums">
            {games.length}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">Có chấm điểm tự động</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Lượt chơi hoàn thành</div>
          <div className="text-2xl font-bold font-display text-rose-600 mt-1 tabular-nums">
            {totalGamePlays}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5">Đã ghi nhận TOP 5</div>
        </div>
      </div>

      {/* 6 Class Cards as requested */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">
              6 Lớp Học Đang Giảng Dạy
            </h3>
            <p className="text-xs text-slate-500">
              Quản lý nhiệm vụ, bài nộp và trò chơi theo từng lớp
            </p>
          </div>
          <button
            onClick={() => onNavigate('classes')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Quản lý danh sách lớp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const classTasks = tasks.filter(t => t.classIds.includes(cls.id) || t.classIds.includes(cls.name));
            const classSubs = submissions.filter(s => s.studentClass === cls.id || s.studentClass.includes(cls.id));
            const classGames = games.filter(g => g.classIds.includes(cls.id) || g.classIds.includes(cls.name));

            // Theme color mappings
            const colorStyles: Record<string, { bg: string; border: string; badge: string; text: string }> = {
              emerald: { bg: 'from-emerald-50 to-teal-50/40', border: 'border-emerald-200', badge: 'bg-emerald-600', text: 'text-emerald-900' },
              blue: { bg: 'from-blue-50 to-sky-50/40', border: 'border-blue-200', badge: 'bg-blue-600', text: 'text-blue-900' },
              indigo: { bg: 'from-indigo-50 to-blue-50/40', border: 'border-indigo-200', badge: 'bg-indigo-600', text: 'text-indigo-900' },
              violet: { bg: 'from-violet-50 to-purple-50/40', border: 'border-violet-200', badge: 'bg-violet-600', text: 'text-violet-900' },
              rose: { bg: 'from-rose-50 to-pink-50/40', border: 'border-rose-200', badge: 'bg-rose-600', text: 'text-rose-900' },
              amber: { bg: 'from-amber-50 to-yellow-50/40', border: 'border-amber-200', badge: 'bg-amber-600', text: 'text-amber-900' },
            };
            const style = colorStyles[cls.colorTheme] || colorStyles.emerald;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-2xl border ${style.border} p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-white font-display font-extrabold text-sm ${style.badge}`}>
                          {cls.id}
                        </span>
                        <h4 className="font-bold text-slate-800 text-base">
                          {cls.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {cls.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700 tabular-nums">
                        {cls.studentCount} HS
                      </div>
                      <div className="text-[11px] text-slate-400">Sĩ số</div>
                    </div>
                  </div>

                  {/* Class Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-xs font-bold text-slate-800 tabular-nums">
                        {classTasks.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Nhiệm vụ</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-xs font-bold text-slate-800 tabular-nums">
                        {classSubs.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Bài đã nộp</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="text-xs font-bold text-slate-800 tabular-nums">
                        {classGames.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Trò chơi</div>
                    </div>
                  </div>
                </div>

                {/* Class Card Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-2">
                  <button
                    onClick={() => onNavigate('tasks', cls.id)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Xem lớp
                  </button>
                  <button
                    onClick={() => onNavigate('submissions', cls.id)}
                    className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Xem danh sách bài tập đã nộp của lớp"
                  >
                    Bài nộp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Column Layout: Active Tasks with quick QR & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks & Quick QR */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Nhiệm vụ đang giao cho học sinh</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Lấy mã QR hoặc link chiếu lên màn hình để học sinh nộp bài
                </p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Xem tất cả ({tasks.length})
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 3).map((task) => {
                const subsForTask = submissions.filter(s => s.taskId === task.id);
                return (
                  <div
                    key={task.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-emerald-700">{task.grade}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600">{task.classIds.join(', ')}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm truncate mt-0.5">
                        {task.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Hạn: {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">{subsForTask.length} bài đã nộp</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onShowQR('task', task.id, task.title, `Lớp: ${task.classIds.join(', ')}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                        title="Tạo & Hiện mã QR cho học sinh quét"
                      >
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Mã QR</span>
                      </button>
                      <button
                        onClick={() => onNavigate('tasks', task.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
                        title="Xem chi tiết"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Quy trình: Tạo nhiệm vụ → Học sinh quét QR → Nộp bài</span>
            <button
              onClick={onOpenCreateTask}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              + Tạo thêm nhiệm vụ mới
            </button>
          </div>
        </section>

        {/* Recent Submissions Feed */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-blue-600" />
                  <span>Bài học sinh mới nộp gần đây</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Học sinh không cần tài khoản, nộp trực tiếp qua link/QR
                </p>
              </div>
              <button
                onClick={() => onNavigate('submissions')}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                Vào kho bài nộp ({submissions.length})
              </button>
            </div>

            <div className="space-y-3">
              {submissions.slice(0, 4).map((sub) => {
                const isReviewed = sub.status === 'reviewed';
                return (
                  <div
                    key={sub.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {sub.studentName}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md">
                            {sub.studentClass}
                          </span>
                          {isReviewed && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Đã chấm ({sub.score}đ)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {sub.fileName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenSubmissionPreview(sub)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        Xem bài
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Dữ liệu được lưu trữ an toàn & đầy đủ</span>
            <button
              onClick={() => onNavigate('submissions')}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Xem tất cả bài nộp →
            </button>
          </div>
        </section>
      </div>

      {/* TOP 5 Hall of Fame Teaser on Dashboard */}
      {gameResults.length > 0 && (
        <section className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/30 border border-amber-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Vinh Danh TOP 5 Trò Chơi Củng Cố
                </h3>
                <p className="text-xs text-slate-600">
                  Thành tích cao nhất từ các trò chơi củng cố kiến thức trong tuần
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
            >
              🏆 Mở Bảng Vinh Danh Chi Tiết
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {gameResults
              .slice()
              .sort((a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds)
              .slice(0, 5)
              .map((res, index) => {
                const rankEmojis = ['🥇 TOP 1', '🥈 TOP 2', '🥉 TOP 3', '⭐ TOP 4', '⭐ TOP 5'];
                const cardColors = [
                  'bg-white border-amber-300 ring-2 ring-amber-400/30',
                  'bg-white border-slate-300',
                  'bg-white border-amber-700/30',
                  'bg-white/80 border-slate-200',
                  'bg-white/80 border-slate-200',
                ];
                return (
                  <div
                    key={res.id}
                    className={`p-3 rounded-xl border text-center shadow-2xs flex flex-col justify-between ${cardColors[index] || 'bg-white'}`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-amber-800">
                        {rankEmojis[index]}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={res.studentName}>
                        {res.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Lớp {res.studentClass}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-emerald-700 tabular-nums">
                        {res.score} điểm
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({res.timeSpentSeconds}s)</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
};
