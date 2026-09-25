import React, { useState } from 'react';
import { Classroom, Game, GameResult } from '../types';
import { 
  Gamepad2, 
  Plus, 
  QrCode, 
  Copy, 
  Trophy, 
  Clock, 
  Play, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Users, 
  Check, 
  BarChart3,
  Award,
  Lock,
  Link as LinkIcon
} from 'lucide-react';
import { storage } from '../services/storage';
import { ExportLinkModal } from './ExportLinkModal';

interface GameManagementProps {
  games: Game[];
  classes: Classroom[];
  gameResults: GameResult[];
  onOpenCreateGame: (gameToEdit?: Game) => void;
  onShowQR: (type: 'task' | 'game' | 'class', id: string, title: string, subtitle?: string) => void;
  onNavigateToResults: (gameId: string) => void;
  onRefresh: () => void;
  onTestPlayGame: (gameId: string) => void;
  isOwner?: boolean;
  onRequestLogin?: () => void;
}

export const GameManagement: React.FC<GameManagementProps> = ({
  games,
  classes,
  gameResults,
  onOpenCreateGame,
  onShowQR,
  onNavigateToResults,
  onRefresh,
  onTestPlayGame,
  isOwner = false,
  onRequestLogin,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportModalGame, setExportModalGame] = useState<Game | null>(null);

  const handleCopyLink = async (gameId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?mode=game&gameId=${gameId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(gameId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Sao chép đường dẫn trò chơi:', url);
    }
  };

  const handleCreateGameClick = () => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    onOpenCreateGame();
  };

  const handleEditGameClick = (game: Game) => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    onOpenCreateGame(game);
  };

  const handleDeleteGame = (game: Game) => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (window.confirm(`Xác nhận xóa trò chơi "${game.title}"?`)) {
      storage.deleteGame(game.id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase">
            <Gamepad2 className="w-4 h-4" />
            <span>Gamification & Hoạt Động Tương Tác</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            Trò Chơi Củng Cố Kiến Thức
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo thử thách nhanh cuối tiết học: Trắc nghiệm A/B/C/D, Đúng/Sai, Điền từ, Ghép đôi, Sắp xếp thứ tự. Học sinh quét QR tham gia ngay không cần tài khoản.
          </p>
        </div>

        <button
          onClick={handleCreateGameClick}
          className={`inline-flex items-center gap-2 px-5 py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 hover:scale-[1.02] ${
            isOwner ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-800'
          }`}
          title={isOwner ? "Tạo trò chơi mới" : "Đăng nhập chủ tài khoản để tạo trò chơi"}
        >
          {isOwner ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-300" />}
          <span>+ TẠO TRÒ CHƠI MỚI</span>
        </button>
      </div>

      {/* Games List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {games.map((game) => {
          const results = gameResults.filter((r) => r.gameId === game.id);
          const topScorer = results.slice().sort((a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds)[0];
          const isCopied = copiedId === game.id;

          return (
            <div
              key={game.id}
              className="bg-white rounded-2xl border border-purple-100 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {game.grade}
                      </span>
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        Lớp: {game.classIds.join(', ')}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{game.subject}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                      {game.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditGameClick(game)}
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title={isOwner ? "Sửa trò chơi" : "Đăng nhập chủ tài khoản để sửa"}
                    >
                      {isOwner ? <Edit className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={isOwner ? "Xóa trò chơi" : "Đăng nhập chủ tài khoản để xóa"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                  {game.description || 'Trò chơi củng cố kiến thức trực tiếp trong tiết dạy.'}
                </p>

                {/* Specs overview */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400">Số câu hỏi</div>
                    <div className="text-xs font-bold text-slate-800 tabular-nums mt-0.5">
                      {game.questions.length} câu
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400">Thời gian</div>
                    <div className="text-xs font-bold text-slate-800 tabular-nums mt-0.5">
                      {game.timeLimitSeconds > 0 ? `${game.timeLimitSeconds / 60} phút` : 'Tự do'}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400">Lượt tham gia</div>
                    <div className="text-xs font-bold text-purple-700 tabular-nums mt-0.5">
                      {game.playCount || results.length} lượt
                    </div>
                  </div>
                </div>

                {/* Top 1 preview if available */}
                {topScorer && (
                  <div className="mt-3 py-2 px-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Đang dẫn đầu: <strong>{topScorer.studentName}</strong> ({topScorer.studentClass})</span>
                    </span>
                    <span className="font-extrabold text-amber-800 tabular-nums">
                      {topScorer.score}đ ({topScorer.timeSpentSeconds}s)
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Primary XUẤT LINK Button */}
                  <button
                    onClick={() => setExportModalGame(game)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Xuất link trực tiếp đúng địa chỉ trò chơi này"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>XUẤT LINK</span>
                  </button>

                  <button
                    onClick={() => onShowQR('game', game.id, game.title, `Lớp: ${game.classIds.join(', ')}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(game.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onTestPlayGame(game.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
                    title="Chơi thử với tư cách học sinh"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chơi thử</span>
                  </button>

                  <button
                    onClick={() => onNavigateToResults(game.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bảng TOP 5</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Link Modal for Game */}
      <ExportLinkModal
        isOpen={Boolean(exportModalGame)}
        onClose={() => setExportModalGame(null)}
        type="game"
        item={exportModalGame}
        onShowQR={onShowQR}
        onOpenPreview={(type, id) => onTestPlayGame(id)}
      />
    </div>
  );
};
