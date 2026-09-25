import React, { useState, useEffect } from 'react';
import { Classroom, Game, GameQuestion, GameResult } from '../types';
import { 
  Gamepad2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Trophy, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  School, 
  RotateCcw,
  Check,
  Award,
  HelpCircle,
  MoveUp,
  MoveDown,
  Star
} from 'lucide-react';
import { storage } from '../services/storage';
import confetti from 'canvas-confetti';

interface StudentGameViewProps {
  games: Game[];
  classes: Classroom[];
  initialGameId?: string;
  onBackToTeacher?: () => void;
  onOpenStudentPortal?: (studentId?: string, classId?: string) => void;
}

export const StudentGameView: React.FC<StudentGameViewProps> = ({
  games,
  classes,
  initialGameId,
  onBackToTeacher,
  onOpenStudentPortal,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(
    initialGameId || games[0]?.id || ''
  );

  useEffect(() => {
    if (initialGameId && games.some((g) => g.id === initialGameId)) {
      setSelectedGameId(initialGameId);
    }
  }, [initialGameId, games]);

  // Registration state
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('10A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Gameplay state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [matchingState, setMatchingState] = useState<Record<string, Record<string, string>>>({}); // questionId -> { leftId: rightId }
  const [selectedLeftKey, setSelectedLeftKey] = useState<string | null>(null);
  const [orderedState, setOrderedState] = useState<Record<string, string[]>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerLeft, setTimerLeft] = useState(0);

  // Result state
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  const activeGame = games.find((g) => g.id === selectedGameId) || games[0];
  const classStudents = storage.getStudentsByClass(studentClass);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !isFinished) {
      interval = setInterval(() => {
        setTimeSpent((t) => t + 1);
        if (activeGame?.timeLimitSeconds && activeGame.timeLimitSeconds > 0) {
          setTimerLeft((left) => {
            if (left <= 1) {
              clearInterval(interval);
              handleSubmitQuiz();
              return 0;
            }
            return left - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished, activeGame]);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass || !activeGame) return;

    // Initialize ordering questions with shuffled items
    const initialOrders: Record<string, string[]> = {};
    activeGame.questions.forEach((q) => {
      if (q.type === 'ordering' && q.orderedItems) {
        initialOrders[q.id] = [...q.orderedItems].sort(() => Math.random() - 0.5);
      }
    });
    setOrderedState(initialOrders);

    setIsPlaying(true);
    setIsFinished(false);
    setCurrentIndex(0);
    setAnswers({});
    setMatchingState({});
    setTimeSpent(0);
    setTimerLeft(activeGame.timeLimitSeconds || 0);
  };

  const handleSelectOption = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleMoveOrder = (questionId: string, idx: number, direction: 'up' | 'down') => {
    const list = [...(orderedState[questionId] || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    setOrderedState({ ...orderedState, [questionId]: list });
  };

  const handleMatchClick = (questionId: string, side: 'left' | 'right', val: string) => {
    if (side === 'left') {
      setSelectedLeftKey(val);
    } else if (side === 'right' && selectedLeftKey) {
      const cur = matchingState[questionId] || {};
      setMatchingState({
        ...matchingState,
        [questionId]: {
          ...cur,
          [selectedLeftKey]: val,
        },
      });
      setSelectedLeftKey(null);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeGame || isFinished) return;

    let totalScore = 0;
    let correctCount = 0;
    const questions = activeGame.questions;
    const maxScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    questions.forEach((q) => {
      const userAns = answers[q.id];
      if (q.type === 'multiple_choice') {
        if (userAns === q.correctAnswer) {
          totalScore += q.points || 0;
          correctCount++;
        }
      } else if (q.type === 'true_false') {
        if (userAns === q.correctBool) {
          totalScore += q.points || 0;
          correctCount++;
        }
      } else if (q.type === 'short_answer') {
        const text = (userAns || '').toString().trim().toLowerCase();
        const matched = q.acceptedAnswers?.some((ans) => ans.trim().toLowerCase() === text);
        if (matched) {
          totalScore += q.points || 0;
          correctCount++;
        }
      } else if (q.type === 'matching') {
        const matches = matchingState[q.id] || {};
        const pairs = q.pairs || [];
        const isAllCorrect = pairs.length > 0 && pairs.every((p) => matches[p.left] === p.right);
        if (isAllCorrect) {
          totalScore += q.points || 0;
          correctCount++;
        }
      } else if (q.type === 'ordering') {
        const currentOrder = orderedState[q.id] || [];
        const targetOrder = q.orderedItems || [];
        const isAllCorrect = currentOrder.length === targetOrder.length && currentOrder.every((item, i) => item === targetOrder[i]);
        if (isAllCorrect) {
          totalScore += q.points || 0;
          correctCount++;
        }
      }
    });

    const result: GameResult = {
      id: `result-${Date.now()}`,
      gameId: activeGame.id,
      gameTitle: activeGame.title,
      studentName: studentName.trim(),
      studentClass,
      score: totalScore,
      maxScore,
      correctCount,
      incorrectCount: questions.length - correctCount,
      totalQuestions: questions.length,
      timeSpentSeconds: timeSpent,
      completedAt: new Date().toISOString(),
    };

    storage.saveGameResult(result);
    setGameResult(result);
    setIsFinished(true);
    setIsPlaying(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const currentQ = activeGame?.questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white pb-16">
      {/* Top Bar */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm sm:text-base leading-tight text-white">
                TRÒ CHƠI CỦNG CỐ KIẾN THỨC
              </h1>
              <p className="text-[11px] text-purple-300">
                Lớp Học Số – Cô Giáo Nguyễn Thị Dung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && activeGame?.timeLimitSeconds && activeGame.timeLimitSeconds > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {onBackToTeacher && (
              <button
                onClick={onBackToTeacher}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Giao diện Giáo viên
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Step 1: Registration Form if not playing and not finished */}
        {!isPlaying && !isFinished && (
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Gamepad2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                {activeGame?.title || 'Trò Chơi Củng Cố'}
              </h2>
              <p className="text-xs text-purple-200 mt-1 max-w-sm mx-auto">
                {activeGame?.description || 'Tham gia thử thách củng cố kiến thức và ghi danh vào Bảng Vinh Danh TOP 5!'}
              </p>
            </div>

            {/* Game Specs */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
              <div className="text-center">
                <div className="text-slate-400 text-[11px]">Số lượng câu hỏi</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {activeGame?.questions.length} câu
                </div>
              </div>
              <div className="text-center border-l border-white/10">
                <div className="text-slate-400 text-[11px]">Thời gian</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {activeGame?.timeLimitSeconds ? `${activeGame.timeLimitSeconds / 60} phút` : 'Tự do'}
                </div>
              </div>
            </div>

            <form onSubmit={handleStartGame} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Nhập Họ và tên của em <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    list="game-student-names"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="VD: Trần Bảo Minh (hoặc chọn tên em trong danh sách)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-purple-500/40 rounded-xl text-white text-xs outline-hidden focus:border-purple-400"
                  />
                  <datalist id="game-student-names">
                    {classStudents.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.studentCode ? `${s.studentCode} - ${s.name}` : s.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">
                  Chọn Lớp học <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-purple-500/40 rounded-xl text-white text-xs outline-hidden focus:border-purple-400"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.id} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Matched Student Account Live Status */}
              {(() => {
                const classStudents = storage.getStudentsByClass(studentClass);
                const matchedInForm = classStudents.find(
                  (s) => s.name.toLowerCase().trim() === studentName.toLowerCase().trim()
                );
                if (!matchedInForm) return null;
                return (
                  <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs space-y-1 animate-fade-in text-left">
                    <div className="flex items-center justify-between font-bold text-purple-200">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Tài khoản: {matchedInForm.name}</span>
                      </div>
                      <span className="text-[11px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-400/30">
                        {matchedInForm.studentCode || 'HS-SO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-purple-300">
                      <span>Tổng điểm hiện tại: <strong>{matchedInForm.totalScore || 0}đ</strong> (Hạng #{matchedInForm.rankInClass || 1})</span>
                      <span className="font-semibold text-emerald-400">+Điểm game sau khi hoàn thành</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!studentName.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>BẮT ĐẦU THỬ THÁCH NGAY</span>
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-400 mt-2">
                Không cần tài khoản · Điểm số lưu trực tiếp vào bảng vinh danh
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Interactive Game Player */}
        {isPlaying && currentQ && (
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            {/* Question Progress Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold">
                  Câu {currentIndex + 1} / {activeGame.questions.length}
                </span>
                <span className="text-slate-400">({currentQ.points} điểm)</span>
              </div>

              <div className="text-slate-400 font-mono">
                Đã làm: {timeSpent}s
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / activeGame.questions.length) * 100}%` }}
              />
            </div>

            {/* Question Prompt */}
            <div className="my-4">
              <h3 className="text-base sm:text-lg font-bold leading-relaxed text-white">
                {currentQ.prompt}
              </h3>
            </div>

            {/* Render based on Question Type */}
            {currentQ.type === 'multiple_choice' && (
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options?.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  const optLabels = ['A', 'B', 'C', 'D', 'E'];
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-400 text-white ring-2 ring-purple-400/30 shadow-md'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-300'
                      }`}>
                        {optLabels[oIdx] || oIdx + 1}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSelectOption(currentQ.id, true)}
                  className={`p-6 rounded-2xl border text-center text-sm font-bold transition-all cursor-pointer ${
                    answers[currentQ.id] === true
                      ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="text-2xl mb-1">✓</div>
                  <span>ĐÚNG</span>
                </button>
                <button
                  onClick={() => handleSelectOption(currentQ.id, false)}
                  className={`p-6 rounded-2xl border text-center text-sm font-bold transition-all cursor-pointer ${
                    answers[currentQ.id] === false
                      ? 'bg-rose-600/30 border-rose-400 text-rose-300 ring-2 ring-rose-400/40 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="text-2xl mb-1">✕</div>
                  <span>SAI</span>
                </button>
              </div>
            )}

            {currentQ.type === 'short_answer' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Nhập câu trả lời của em tại đây..."
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/40 rounded-xl text-white text-sm outline-hidden focus:border-purple-400"
                />
              </div>
            )}

            {currentQ.type === 'matching' && (
              <div className="space-y-3">
                <p className="text-xs text-purple-200">
                  Nhấn chọn 1 mục ở cột trái, sau đó nhấn chọn mục tương ứng ở cột phải để ghép đôi:
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-2">
                    <div className="font-bold text-slate-400 text-[11px]">Cột A:</div>
                    {currentQ.pairs?.map((p) => {
                      const isMatched = !!matchingState[currentQ.id]?.[p.left];
                      const isSelected = selectedLeftKey === p.left;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleMatchClick(currentQ.id, 'left', p.left)}
                          className={`w-full p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 border-purple-300 text-white ring-2 ring-purple-400'
                              : isMatched
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                          }`}
                        >
                          {p.left} {isMatched && '🔗'}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-400 text-[11px]">Cột B:</div>
                    {currentQ.pairs?.map((p) => {
                      const matches = matchingState[currentQ.id] || {};
                      const matchedLeft = Object.keys(matches).find((k) => matches[k] === p.right);
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleMatchClick(currentQ.id, 'right', p.right)}
                          className={`w-full p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                            matchedLeft
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                          }`}
                        >
                          {p.right}
                          {matchedLeft && (
                            <span className="block text-[10px] text-emerald-400 mt-0.5 truncate">
                              → Khớp với: {matchedLeft}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentQ.type === 'ordering' && (
              <div className="space-y-3">
                <p className="text-xs text-purple-200">
                  Dùng mũi tên lên / xuống để sắp xếp các bước theo đúng trình tự:
                </p>
                <div className="space-y-2">
                  {(orderedState[currentQ.id] || currentQ.orderedItems || []).map((item, idx, arr) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-purple-600/40 text-purple-300 font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 font-medium">{item}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(currentQ.id, idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 hover:bg-white/10 disabled:opacity-20 rounded"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(currentQ.id, idx, 'down')}
                          disabled={idx === arr.length - 1}
                          className="p-1.5 hover:bg-white/10 disabled:opacity-20 rounded"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Câu trước
              </button>

              {currentIndex < activeGame.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((idx) => idx + 1)}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-xl cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>HOÀN THÀNH & NỘP BÀI</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Result & Hall of Fame Placement */}
        {isFinished && gameResult && (
          <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
              <Trophy className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Chúc Mừng Em Đã Hoàn Thành!
              </span>
              <h2 className="text-2xl font-bold font-display text-white">
                {gameResult.studentName} – Lớp {gameResult.studentClass}
              </h2>
              <p className="text-xs text-purple-200 mt-1">{gameResult.gameTitle}</p>
            </div>

            {/* Score Display */}
            <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/15 p-6 rounded-2xl">
              <div className="text-xs text-slate-300 uppercase tracking-wider">Tổng Điểm Đạt Được</div>
              <div className="text-4xl sm:text-5xl font-extrabold font-display text-amber-400 mt-1 tabular-nums">
                {gameResult.score} <span className="text-lg text-slate-400 font-normal">/ {gameResult.maxScore}đ</span>
              </div>
              <div className="mt-3 text-xs text-emerald-300 flex items-center justify-center gap-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{gameResult.correctCount}/{gameResult.totalQuestions} câu đúng</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{gameResult.timeSpentSeconds} giây</span>
                </span>
              </div>
            </div>

            {/* Student Account Score Feedback */}
            {(() => {
              const matchedStudent = storage.getStudentByCodeOrName(gameResult.studentClass, gameResult.studentName);
              return (
                <div className="bg-purple-950/80 border border-purple-500/40 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>+{gameResult.score} Điểm Trò Chơi Đã Tự Động Cộng Vào Tài Khoản!</span>
                  </div>
                  <div className="text-xs text-purple-200 flex justify-between items-center">
                    <span>Mã tài khoản học sinh:</span>
                    <span className="font-mono font-bold text-white">{matchedStudent?.studentCode || 'HS-SO'}</span>
                  </div>
                  <div className="text-xs text-purple-200 flex justify-between items-center">
                    <span>Tổng điểm tích lũy mới:</span>
                    <span className="font-extrabold text-amber-400 text-sm">
                      {matchedStudent?.totalScore || gameResult.score} điểm (Hạng #{matchedStudent?.rankInClass || 1} lớp {gameResult.studentClass})
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowReview(!showReview)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {showReview ? 'Ẩn xem lại đáp án' : 'Xem lại đáp án & giải thích'}
              </button>

              <button
                onClick={() => {
                  setIsFinished(false);
                  setIsPlaying(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm Lại Lượt Mới</span>
              </button>

              {onOpenStudentPortal && (
                <button
                  onClick={() => {
                    const matched = storage.getStudentByCodeOrName(gameResult.studentClass, gameResult.studentName);
                    onOpenStudentPortal(matched?.id, gameResult.studentClass);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>Xem Bảng Điểm & Thi Đua Lớp</span>
                </button>
              )}
            </div>

            {/* Detailed answers review */}
            {showReview && (
              <div className="mt-6 pt-6 border-t border-white/10 text-left space-y-4">
                <h4 className="font-bold text-sm text-purple-200">Chi Tiết Từng Câu Hỏi:</h4>
                {activeGame.questions.map((q, idx) => {
                  return (
                    <div key={q.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-1.5">
                      <div className="font-bold text-white">
                        Câu {idx + 1}: {q.prompt}
                      </div>
                      <div className="text-emerald-300">
                        <strong>Đáp án chuẩn: </strong>
                        {q.type === 'multiple_choice' && q.correctAnswer}
                        {q.type === 'true_false' && (q.correctBool ? 'ĐÚNG' : 'SAI')}
                        {q.type === 'short_answer' && q.acceptedAnswers?.join(', ')}
                        {q.type === 'matching' && 'Ghép đôi theo quy định'}
                        {q.type === 'ordering' && q.orderedItems?.join(' → ')}
                      </div>
                      {q.explanation && (
                        <div className="text-slate-300 text-[11px] italic bg-white/5 p-2 rounded-lg">
                          💡 Giải thích: {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
