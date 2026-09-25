import React, { useState, useEffect } from 'react';
import { Classroom, Student, Submission, GameResult, Task, Game } from '../types';
import { 
  GraduationCap, 
  Trophy, 
  Award, 
  Star, 
  Zap, 
  Target, 
  Flame, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Gamepad2, 
  Search, 
  ArrowLeft, 
  TrendingUp, 
  ChevronRight,
  FileText,
  Sparkles,
  Smartphone,
  ShieldCheck,
  User
} from 'lucide-react';
import { storage } from '../services/storage';

interface StudentPortalViewProps {
  classes: Classroom[];
  students: Student[];
  submissions: Submission[];
  gameResults: GameResult[];
  tasks: Task[];
  games: Game[];
  initialStudentId?: string;
  initialClassId?: string;
  onNavigateToTask: (taskId?: string) => void;
  onNavigateToGame: (gameId?: string) => void;
  onBackToTeacher: () => void;
  onRefresh: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  classes,
  students,
  submissions,
  gameResults,
  tasks,
  games,
  initialStudentId,
  initialClassId = '10A',
  onNavigateToTask,
  onNavigateToGame,
  onBackToTeacher,
  onRefresh,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(initialClassId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [searchName, setSearchName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'games' | 'leaderboard'>('overview');

  const classStudents = students.filter(s => s.classId === selectedClass)
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  const currentStudent = students.find(s => s.id === selectedStudentId) || classStudents[0] || null;

  useEffect(() => {
    if (!selectedStudentId && classStudents.length > 0) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [selectedClass, students]);

  // Student specific data
  const studentSubs = currentStudent ? submissions.filter(s => 
    (s.studentClass === currentStudent.classId || s.studentClass.includes(currentStudent.classId)) &&
    s.studentName.toLowerCase().trim() === currentStudent.name.toLowerCase().trim()
  ) : [];

  const studentGames = currentStudent ? gameResults.filter(g => 
    (g.studentClass === currentStudent.classId || g.studentClass.includes(currentStudent.classId)) &&
    g.studentName.toLowerCase().trim() === currentStudent.name.toLowerCase().trim()
  ) : [];

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy': return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'zap': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'target': return <Target className="w-4 h-4 text-emerald-500" />;
      case 'flame': return <Flame className="w-4 h-4 text-rose-500" />;
      default: return <Star className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToTeacher}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về màn hình chính</span>
            </button>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">
                  TÀI KHOẢN HỌC SINH & SỔ ĐIỂM SỐ
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">
                  Lớp học Tin học – Cô giáo Nguyễn Thị Dung
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTask()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Nộp bài tập</span>
            </button>
            <button
              onClick={() => onNavigateToGame()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Chơi game</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Class and Student Account Switcher */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Chọn Tài Khoản Học Sinh Để Tra Cứu Điểm Số</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Step 1: Select Class */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Bước 1: Chọn Lớp Học
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClass(c.id);
                      const first = students.find(s => s.classId === c.id);
                      if (first) setSelectedStudentId(first.id);
                    }}
                    className={`py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedClass === c.id
                        ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Student */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Bước 2: Chọn Học Sinh Trong Lớp ({classStudents.length} em)
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {classStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.studentCode ? `[${st.studentCode}] ` : ''}{st.name} — {st.totalScore || 0} điểm (Hạng #{st.rankInClass || 1})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {currentStudent ? (
          <>
            {/* Student ID Card / Hero Header */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-800/90 to-emerald-950/40 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-display font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-emerald-300/30">
                    {currentStudent.name.charAt(currentStudent.name.lastIndexOf(' ') + 1) || currentStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Lớp {currentStudent.classId}
                      </span>
                      <span className="font-mono text-xs bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-600">
                        {currentStudent.studentCode || 'HS-SO'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {currentStudent.gender || 'Nam'}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
                      {currentStudent.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tài khoản học sinh được tích hợp tự động cộng điểm khi nộp bài và chơi trò chơi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    onClick={() => onNavigateToTask()}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Nộp bài ngay (+10đ)</span>
                  </button>
                  <button
                    onClick={() => onNavigateToGame()}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Chơi game (+100đ)</span>
                  </button>
                </div>
              </div>

              {/* 4 Score Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tổng Điểm Tích Lũy</span>
                  </div>
                  <div className="text-3xl font-extrabold font-display text-white mt-1">
                    {currentStudent.totalScore || 0}
                    <span className="text-xs font-normal text-emerald-400 ml-1">điểm</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Cộng từ bài nộp & trò chơi
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Xếp Hạng Lớp</span>
                  </div>
                  <div className="text-3xl font-extrabold font-display text-amber-300 mt-1">
                    #{currentStudent.rankInClass || 1}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ {classStudents.length} HS</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Thứ hạng thi đua lớp {currentStudent.classId}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-[11px] font-bold uppercase text-blue-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Điểm Bài Tập</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-200 mt-1">
                    +{currentStudent.submissionScore || 0}
                    <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {currentStudent.submissionCount || 0} bài tập đã nộp
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4">
                  <div className="text-[11px] font-bold uppercase text-purple-400 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Điểm Trò Chơi</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-200 mt-1">
                    +{currentStudent.gameScore || 0}
                    <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {currentStudent.gameCount || 0} lần thử thách
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Section */}
            {currentStudent.badges && currentStudent.badges.length > 0 && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Huy Hiệu Rèn Luyện Đã Thu Thập ({currentStudent.badges.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentStudent.badges.map((b) => (
                    <div key={b.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        {getBadgeIcon(b.icon)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-amber-300">{b.name}</div>
                        <div className="text-[11px] text-amber-200/70 leading-tight mt-0.5">{b.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Tabs: Overview/History vs Submissions vs Games vs Leaderboard */}
            <div className="space-y-4">
              <div className="flex border-b border-slate-700 gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Lịch Sử Cộng Điểm ({currentStudent.scoreHistory?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'submissions'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kho Bài Đã Nộp ({studentSubs.length})
                </button>
                <button
                  onClick={() => setActiveTab('games')}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'games'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kết Quả Trò Chơi ({studentGames.length})
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bảng Xếp Hạng Lớp {currentStudent.classId}
                </button>
              </div>

              {/* TAB 1: HISTORY */}
              {activeTab === 'overview' && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-700/60">
                  {currentStudent.scoreHistory && currentStudent.scoreHistory.length > 0 ? (
                    currentStudent.scoreHistory.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-750 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === 'game' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : item.type === 'review'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.type === 'bonus'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.type === 'game' ? <Gamepad2 className="w-5 h-5" /> :
                             item.type === 'review' ? <CheckCircle2 className="w-5 h-5" /> :
                             item.type === 'bonus' ? <Sparkles className="w-5 h-5" /> :
                             <BookOpen className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">{item.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(item.date).toLocaleString('vi-VN')} {item.note ? `· ${item.note}` : ''}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="font-extrabold text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                            +{item.pointsEarned} điểm
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Chưa có lịch sử điểm số. Em hãy nộp bài tập hoặc tham gia trò chơi để bắt đầu tích lũy điểm nhé!
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SUBMISSIONS */}
              {activeTab === 'submissions' && (
                <div className="space-y-3">
                  {studentSubs.length > 0 ? (
                    studentSubs.map((sub) => (
                      <div key={sub.id} className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-white">{sub.taskTitle}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <span>Nộp: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</span>
                              <span>·</span>
                              <span>File: {sub.fileName} ({sub.fileSize})</span>
                            </div>
                          </div>
                          <div>
                            {sub.score !== undefined ? (
                              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl">
                                {sub.score}/10 điểm
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium text-xs rounded-xl">
                                Đã nộp · Chờ cô chấm
                              </span>
                            )}
                          </div>
                        </div>
                        {sub.teacherFeedback && (
                          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-200">
                            <span className="font-bold text-emerald-400">Nhận xét của Cô Dung:</span> {sub.teacherFeedback}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-800/80 rounded-2xl border border-slate-700">
                      Em chưa nộp bài tập nào cho lớp này.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: GAMES */}
              {activeTab === 'games' && (
                <div className="space-y-3">
                  {studentGames.length > 0 ? (
                    studentGames.map((game) => (
                      <div key={game.id} className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white">{game.gameTitle}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>{new Date(game.completedAt).toLocaleString('vi-VN')}</span>
                            <span>·</span>
                            <span>Đúng {game.correctCount}/{game.totalQuestions} câu</span>
                            <span>·</span>
                            <span>Thời gian: {game.timeSpentSeconds}s</span>
                          </div>
                        </div>
                        <div>
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-xl">
                            {game.score}/{game.maxScore} điểm
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-800/80 rounded-2xl border border-slate-700">
                      Em chưa tham gia trò chơi củng cố nào.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LEADERBOARD */}
              {activeTab === 'leaderboard' && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>BẢNG XẾP HẠNG THI ĐUA LỚP {currentStudent.classId}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {classStudents.length} học sinh
                    </span>
                  </div>

                  <div className="divide-y divide-slate-700/60">
                    {classStudents.map((st, idx) => {
                      const isMe = st.id === currentStudent.id;
                      return (
                        <div
                          key={st.id}
                          className={`p-3.5 flex items-center justify-between transition-colors ${
                            isMe ? 'bg-emerald-950/40 border-l-4 border-emerald-500' : 'hover:bg-slate-750'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              idx === 0 ? 'bg-amber-500 text-slate-950' :
                              idx === 1 ? 'bg-slate-300 text-slate-900' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white flex items-center gap-2">
                                <span>{st.name}</span>
                                {isMe && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md">
                                    Em
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {st.studentCode || ''} · {st.submissionCount || 0} bài nộp · {st.gameCount || 0} trò chơi
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-sm text-emerald-400">
                              {st.totalScore || 0} đ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-800/80 rounded-2xl border border-slate-700">
            Chưa có học sinh nào trong lớp {selectedClass}. Hãy liên hệ giáo viên để thêm học sinh.
          </div>
        )}
      </main>
    </div>
  );
};
