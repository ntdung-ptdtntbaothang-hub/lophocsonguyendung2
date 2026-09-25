import React, { useState } from 'react';
import { Student, Submission, GameResult } from '../types';
import { 
  X, 
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
  Plus, 
  FileText, 
  Calendar, 
  Phone, 
  User, 
  Sparkles,
  TrendingUp,
  History,
  Send
} from 'lucide-react';
import { storage } from '../services/storage';

interface StudentAccountModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  submissions: Submission[];
  gameResults: GameResult[];
  onRefresh: () => void;
  isTeacherView?: boolean;
  isOwner?: boolean;
  onRequestLogin?: () => void;
}

export const StudentAccountModal: React.FC<StudentAccountModalProps> = ({
  student,
  isOpen,
  onClose,
  submissions,
  gameResults,
  onRefresh,
  isTeacherView = true,
  isOwner = false,
  onRequestLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'games' | 'history'>('overview');
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(5);
  const [bonusReason, setBonusReason] = useState('Phát biểu xây dựng bài tích cực');

  if (!isOpen || !student) return null;

  // Filter student-specific items
  const studentSubs = submissions.filter(s => 
    (s.studentClass === student.classId || s.studentClass.includes(student.classId)) &&
    s.studentName.toLowerCase().trim() === student.name.toLowerCase().trim()
  );

  const studentGames = gameResults.filter(g => 
    (g.studentClass === student.classId || g.studentClass.includes(student.classId)) &&
    g.studentName.toLowerCase().trim() === student.name.toLowerCase().trim()
  );

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (bonusPoints <= 0) return;
    storage.addBonusScore(student.id, bonusPoints, bonusReason);
    onRefresh();
    setIsBonusModalOpen(false);
  };

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
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.25),transparent_70%)] pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-900 font-display font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {student.name.charAt(student.name.lastIndexOf(' ') + 1) || student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Lớp {student.classId}
                  </span>
                  <span className="font-mono text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                    {student.studentCode || 'HS-CHUA-CAP'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {student.gender || 'Nam'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display mt-1 text-white flex items-center gap-2">
                  {student.name}
                </h3>
                <p className="text-xs text-emerald-300/80 mt-0.5 flex items-center gap-2">
                  <span>Hồ sơ tài khoản học sinh</span>
                  <span>·</span>
                  <span>Tin học THPT</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Score Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <div className="text-[11px] text-emerald-300 font-semibold uppercase flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Tổng Điểm</span>
              </div>
              <div className="text-2xl font-extrabold text-white font-display mt-0.5">
                {student.totalScore || 0} <span className="text-xs font-normal text-emerald-300">đ</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <div className="text-[11px] text-slate-300 font-semibold uppercase flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Xếp Hạng</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-300 font-display mt-0.5">
                #{student.rankInClass || 1} <span className="text-xs font-normal text-slate-300">/ lớp</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <div className="text-[11px] text-slate-300 font-semibold uppercase flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Điểm Bài Tập</span>
              </div>
              <div className="text-xl font-bold text-blue-200 mt-1">
                {student.submissionScore || 0} <span className="text-xs font-normal text-slate-300">({student.submissionCount || 0} bài)</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <div className="text-[11px] text-slate-300 font-semibold uppercase flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Điểm Trò Chơi</span>
              </div>
              <div className="text-xl font-bold text-purple-200 mt-1">
                {student.gameScore || 0} <span className="text-xs font-normal text-slate-300">({student.gameCount || 0} lượt)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Hồ sơ & Huy hiệu
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Lịch sử cộng điểm ({student.scoreHistory?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'submissions'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Bài đã nộp ({studentSubs.length})
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'games'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Trò chơi củng cố ({studentGames.length})
            </button>
          </div>

          {isTeacherView && (
            <button
              onClick={() => setIsBonusModalOpen(true)}
              className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thưởng điểm</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Information & Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Thông tin cá nhân & Liên hệ</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mã tài khoản học sinh:</span>
                      <span className="font-mono font-bold text-slate-800">{student.studentCode || 'Chưa cấp'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Ngày sinh:</span>
                      <span className="font-medium text-slate-800">{student.birthDate || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Số điện thoại phụ huynh:</span>
                      <span className="font-medium font-mono text-slate-800">{student.phoneNumber || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Ghi chú giáo viên:</span>
                      <span className="font-medium text-slate-800">{student.note || 'Không có ghi chú'}</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Cơ cấu điểm tích lũy</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-600 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        Điểm bài nộp & cô chấm:
                      </span>
                      <span className="font-bold text-blue-700">+{student.submissionScore || 0} điểm</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5 text-purple-500" />
                        Điểm trò chơi tương tác:
                      </span>
                      <span className="font-bold text-purple-700">+{student.gameScore || 0} điểm</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                        Điểm thưởng phát biểu:
                      </span>
                      <span className="font-bold text-emerald-700">+{student.bonusScore || 0} điểm</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 font-bold text-slate-900">
                      <span>Tổng cộng điểm trong lớp:</span>
                      <span className="text-sm text-emerald-600 font-extrabold">{student.totalScore || 0} điểm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges Section */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Huy hiệu học tập đã đạt ({student.badges?.length || 0})</span>
                </h4>
                {student.badges && student.badges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {student.badges.map((badge) => (
                      <div key={badge.id} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          {getBadgeIcon(badge.icon)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-amber-900">{badge.name}</div>
                          <div className="text-[11px] text-amber-700/90 leading-tight mt-0.5">{badge.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    Chưa có huy hiệu nào. Hãy tích cực nộp bài và hoàn thành trò chơi để nhận huy hiệu!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCORE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Dòng thời gian cộng điểm vào tài khoản</span>
                <span>{student.scoreHistory?.length || 0} giao dịch cộng điểm</span>
              </div>

              {student.scoreHistory && student.scoreHistory.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {student.scoreHistory.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === 'game' 
                            ? 'bg-purple-100 text-purple-700' 
                            : item.type === 'review'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.type === 'bonus'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'game' ? <Gamepad2 className="w-4 h-4" /> :
                           item.type === 'review' ? <CheckCircle2 className="w-4 h-4" /> :
                           item.type === 'bonus' ? <Sparkles className="w-4 h-4" /> :
                           <BookOpen className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{item.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(item.date).toLocaleString('vi-VN')} {item.note ? `· ${item.note}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          +{item.pointsEarned} đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Chưa có lịch sử điểm số.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Toàn bộ bài tập đã nộp của học sinh này</span>
                <span>{studentSubs.length} bài</span>
              </div>

              {studentSubs.length > 0 ? (
                <div className="space-y-2">
                  {studentSubs.map((sub) => (
                    <div key={sub.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{sub.taskTitle}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</span>
                            <span>·</span>
                            <span>File: {sub.fileName} ({sub.fileSize})</span>
                          </div>
                        </div>
                        <div>
                          {sub.score !== undefined ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                              {sub.score}/10 điểm
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
                              Chờ chấm
                            </span>
                          )}
                        </div>
                      </div>
                      {sub.teacherFeedback && (
                        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs text-emerald-900">
                          <span className="font-semibold text-emerald-800">Lời phê của Cô Dung:</span> {sub.teacherFeedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Học sinh chưa nộp bài tập nào.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GAMES */}
          {activeTab === 'games' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Toàn bộ kết quả trò chơi củng cố</span>
                <span>{studentGames.length} lượt hoàn thành</span>
              </div>

              {studentGames.length > 0 ? (
                <div className="space-y-2">
                  {studentGames.map((game) => (
                    <div key={game.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{game.gameTitle}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{new Date(game.completedAt).toLocaleString('vi-VN')}</span>
                          <span>·</span>
                          <span>Đúng {game.correctCount}/{game.totalQuestions} câu</span>
                          <span>·</span>
                          <span>Thời gian: {game.timeSpentSeconds} giây</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200">
                          {game.score}/{game.maxScore} đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Học sinh chưa tham gia trò chơi nào.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Mọi bài nộp và lượt chơi đều được tự động ghi nhận và cộng vào tài khoản của học sinh.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Bonus Score Modal */}
      {isBonusModalOpen && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Thưởng Điểm Phát Biểu / Rèn Luyện</span>
              </h4>
              <button onClick={() => setIsBonusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBonus} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Số điểm cộng (+)</label>
                <div className="flex gap-2">
                  {[2, 5, 10, 15].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBonusPoints(pts)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                        bonusPoints === pts
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      +{pts}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(Number(e.target.value))}
                  className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Lý do thưởng điểm</label>
                <input
                  type="text"
                  required
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="VD: Phát biểu sôi nổi, làm mô hình đẹp..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBonusModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Xác nhận cộng điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
