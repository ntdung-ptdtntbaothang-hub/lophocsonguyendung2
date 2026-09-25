import React, { useState, useEffect } from 'react';
import { Classroom, Game, GameResult } from '../types';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  School, 
  Gamepad2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameResultsAndHonorProps {
  games: Game[];
  classes: Classroom[];
  gameResults: GameResult[];
  initialGameId?: string;
}

export const GameResultsAndHonor: React.FC<GameResultsAndHonorProps> = ({
  games,
  classes,
  gameResults,
  initialGameId,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId || games[0]?.id || 'ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
    });
  };

  useEffect(() => {
    if (initialGameId) {
      setSelectedGameId(initialGameId);
    }
  }, [initialGameId]);

  const activeGame = games.find((g) => g.id === selectedGameId);

  // Filter results
  const filteredResults = gameResults.filter((r) => {
    if (selectedGameId !== 'ALL' && r.gameId !== selectedGameId) return false;
    if (selectedClass !== 'ALL' && !r.studentClass.includes(selectedClass)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.studentName.toLowerCase().includes(q) || r.studentClass.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  const top5 = filteredResults.slice(0, 5);
  const avgScore = filteredResults.length > 0 
    ? Math.round((filteredResults.reduce((acc, r) => acc + r.score, 0) / filteredResults.length) * 10) / 10 
    : 0;

  const handleExportCSV = () => {
    const headers = ['Xếp hạng', 'Họ và tên', 'Lớp', 'Trò chơi', 'Điểm số', 'Số câu đúng', 'Tổng số câu', 'Thời gian hoàn thành (giây)', 'Thời điểm tham gia'];
    const rows = filteredResults.map((r, idx) => [
      idx + 1,
      `"${r.studentName}"`,
      `"${r.studentClass}"`,
      `"${r.gameTitle.replace(/"/g, '""')}"`,
      r.score,
      r.correctCount,
      r.totalQuestions,
      r.timeSpentSeconds,
      `"${new Date(r.completedAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ket_Qua_Xep_Hang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 pb-12 ${isProjectorMode ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto text-white' : ''}`}>
      {/* Top Banner */}
      <div className={`rounded-2xl border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isProjectorMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase">
            <Trophy className="w-4 h-4" />
            <span>Xếp Hạng & Vinh Danh Thành Tích</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold font-display mt-1 ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
            🏆 BẢNG VINH DANH & KẾT QUẢ TRÒ CHƠI
          </h2>
          <p className={`text-xs mt-0.5 ${isProjectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Xếp hạng công bằng từ cao xuống thấp theo điểm số và thời gian. Vinh danh TOP 1 đến TOP 5 tạo động lực học tập tích cực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerConfetti}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Chúc mừng TOP 5 🎉</span>
          </button>

          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isProjectorMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isProjectorMode ? 'Thu nhỏ' : 'Chiếu bảng'}</span>
          </button>

          {!isProjectorMode && (
            <button
              onClick={handleExportCSV}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs"
              title="Xuất bảng điểm CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector and Filter Toolbar */}
      <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
        isProjectorMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Game select tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-slate-400 font-medium">Trò chơi:</span>
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGameId(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedGameId === g.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : isProjectorMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {g.title.length > 35 ? g.title.slice(0, 35) + '...' : g.title}
              </button>
            ))}
            <button
              onClick={() => setSelectedGameId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedGameId === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : isProjectorMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả các trò chơi
            </button>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Lớp:</span>
            <button
              onClick={() => setSelectedClass('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                selectedClass === 'ALL' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Tất cả
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                  selectedClass === cls.id ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {cls.id}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Strip */}
        <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isProjectorMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
        }`}>
          <div>
            Đang hiển thị: <strong className="text-emerald-700 font-bold">{filteredResults.length}</strong> học sinh tham gia
          </div>
          <div className="flex items-center gap-4">
            <span>Điểm trung bình: <strong className="text-amber-800 font-bold">{avgScore} điểm</strong></span>
            <span>Tỷ lệ hoàn thành: <strong className="text-emerald-700 font-bold">100%</strong></span>
          </div>
        </div>
      </div>

      {/* TOP 5 HALL OF FAME PODIUM / CARDS */}
      <section className={`p-6 sm:p-8 rounded-3xl border shadow-lg relative overflow-hidden ${
        isProjectorMode 
          ? 'bg-gradient-to-b from-slate-900 to-indigo-950 border-amber-500/30' 
          : 'bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-orange-50/30 border-amber-300/80'
      }`}>
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 font-extrabold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>VINH DANH THÀNH TÍCH XUẤT SẮC</span>
          </div>
          <h3 className={`text-2xl sm:text-3xl font-display font-extrabold ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
            🏆 BẢNG VINH DANH TOP 5 HỌC SINH
          </h3>
          <p className={`text-xs mt-1 ${isProjectorMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Chúc mừng các bạn đã xuất sắc đạt điểm cao nhất trong hoạt động củng cố kiến thức!
          </p>
        </div>

        {top5.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Chưa có kết quả trò chơi nào được ghi nhận. Hãy cho lớp quét QR để tham gia!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 items-stretch">
            {/* 1st, 2nd, 3rd, 4th, 5th Podium formatting */}
            {top5.map((result, idx) => {
              const rankLabels = ['🥇 TOP 1', '🥈 TOP 2', '🥉 TOP 3', '⭐ TOP 4', '⭐ TOP 5'];
              const styles = [
                // TOP 1
                {
                  card: 'border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white ring-4 ring-amber-400/20 shadow-lg sm:-translate-y-2',
                  badge: 'bg-amber-500 text-white font-extrabold',
                  crown: true,
                },
                // TOP 2
                {
                  card: 'border-2 border-slate-300 bg-gradient-to-b from-slate-50 to-white shadow-md',
                  badge: 'bg-slate-600 text-white font-extrabold',
                  crown: false,
                },
                // TOP 3
                {
                  card: 'border-2 border-amber-700/40 bg-gradient-to-b from-amber-50/50 to-white shadow-md',
                  badge: 'bg-amber-800 text-white font-extrabold',
                  crown: false,
                },
                // TOP 4
                {
                  card: 'border border-slate-200 bg-white/90 shadow-xs',
                  badge: 'bg-slate-200 text-slate-800 font-bold',
                  crown: false,
                },
                // TOP 5
                {
                  card: 'border border-slate-200 bg-white/90 shadow-xs',
                  badge: 'bg-slate-200 text-slate-800 font-bold',
                  crown: false,
                },
              ][idx];

              return (
                <div
                  key={result.id}
                  className={`p-4 rounded-2xl flex flex-col justify-between text-center transition-all duration-200 ${styles.card} ${
                    isProjectorMode ? 'bg-slate-800/90 text-white' : ''
                  }`}
                >
                  <div>
                    {/* Rank Badge */}
                    <div className="flex justify-center mb-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-display tracking-tight shadow-xs ${styles.badge}`}>
                        {rankLabels[idx]}
                      </span>
                    </div>

                    <div className={`font-display font-extrabold text-base tracking-tight truncate ${isProjectorMode ? 'text-white' : 'text-slate-900'}`} title={result.studentName}>
                      {result.studentName}
                    </div>

                    <div className={`text-xs font-bold mt-0.5 ${isProjectorMode ? 'text-indigo-300' : 'text-emerald-700'}`}>
                      Lớp {result.studentClass}
                    </div>
                  </div>

                  {/* Score & Time Box */}
                  <div className={`mt-3 pt-3 border-t ${isProjectorMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className="text-xl font-black font-display text-emerald-800 tabular-nums">
                      {result.score}đ
                    </div>
                    <div className={`text-[11px] mt-0.5 flex items-center justify-center gap-1.5 ${isProjectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{result.correctCount}/{result.totalQuestions} câu</span>
                      <span>·</span>
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{result.timeSpentSeconds}s</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FULL CLASS RANKINGS TABLE */}
      <section className={`rounded-2xl border shadow-xs overflow-hidden ${
        isProjectorMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between text-xs ${
          isProjectorMode ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700 bg-slate-50'
        }`}>
          <div className="font-bold font-display uppercase tracking-wide">
            Bảng Xếp Hạng Đầy Đủ Của Lớp ({filteredResults.length} học sinh)
          </div>
          <div className="text-[11px] text-slate-400">
            Tiêu chí: Điểm số cao hơn → Thời gian nhanh hơn
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isProjectorMode ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <tr>
                <th className="py-3 px-4 w-16 text-center">Hạng</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-3">Lớp</th>
                <th className="py-3 px-4">Trò chơi</th>
                <th className="py-3 px-4 text-center">Điểm số</th>
                <th className="py-3 px-4 text-center">Số câu đúng</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-right">Thời điểm hoàn thành</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isProjectorMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredResults.map((res, index) => {
                const isTop1 = index === 0;
                const isTop5 = index < 5;
                return (
                  <tr
                    key={res.id}
                    className={`transition-colors ${
                      isTop1 
                        ? (isProjectorMode ? 'bg-amber-950/20' : 'bg-amber-50/40') 
                        : (isProjectorMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80')
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-bold">
                      {index === 0 && <span className="text-amber-500 font-display">🥇 1</span>}
                      {index === 1 && <span className="text-slate-400 font-display">🥈 2</span>}
                      {index === 2 && <span className="text-amber-700 font-display">🥉 3</span>}
                      {index > 2 && <span className="text-slate-400 font-mono">{index + 1}</span>}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={isTop5 ? 'text-amber-800' : (isProjectorMode ? 'text-white' : 'text-slate-900')}>
                        {res.studentName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        {res.studentClass}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={res.gameTitle}>
                      {res.gameTitle}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-sm text-emerald-800 tabular-nums">
                        {res.score}
                      </span>
                      <span className="text-[10px] text-slate-400">/{res.maxScore}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium tabular-nums text-slate-700">
                      {res.correctCount}/{res.totalQuestions}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600">
                      {res.timeSpentSeconds}s
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(res.completedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
