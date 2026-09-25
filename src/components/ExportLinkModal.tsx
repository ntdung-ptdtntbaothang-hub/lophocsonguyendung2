import React, { useState } from 'react';
import { Task, Game } from '../types';
import { generateTaskDirectUrl, generateGameDirectUrl } from '../services/taskLink';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  X, 
  BookOpen, 
  Gamepad2, 
  Clock, 
  Send, 
  MessageSquare,
  Sparkles,
  School
} from 'lucide-react';

interface ExportLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task' | 'game';
  item: Task | Game | null;
  onShowQR: (type: 'task' | 'game' | 'class', id: string, title: string, subtitle?: string) => void;
  onOpenPreview: (type: 'task' | 'game', id: string) => void;
}

export const ExportLinkModal: React.FC<ExportLinkModalProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onShowQR,
  onOpenPreview,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen || !item) return null;

  const task = type === 'task' ? (item as Task) : null;
  const game = type === 'game' ? (item as Game) : null;

  // Generate bulletproof direct URL containing exact task data
  const directUrl = type === 'game'
    ? generateGameDirectUrl(item.id, game)
    : generateTaskDirectUrl(item.id, task);

  // Template message for Zalo / Class group
  const messageTemplate = type === 'task' && task
    ? `📢 [THÔNG BÁO TỪ CÔ NGUYỄN THỊ DUNG]\nChào các em học sinh lớp ${task.classIds.join(', ')}!\nCô gửi nhiệm vụ học tập mới: "${task.title}".\n⏰ Thời gian nộp bài: ${task.startDate ? `Từ ${new Date(task.startDate).toLocaleString('vi-VN')} đến ` : ''}${task.endDate || task.deadline ? new Date(task.endDate || task.deadline).toLocaleString('vi-VN') : 'Không giới hạn'}.\n👉 Các em nhấn vào đúng đường dẫn sau để xem yêu cầu và nộp bài trực tiếp (không cần mật khẩu):\n${directUrl}`
    : `🎮 [THỬ THÁCH TRÒ CHƠI TIN HỌC - CÔ DUNG]\nChào các em học sinh lớp ${game?.classIds.join(', ')}!\nCô mời các em tham gia thử thách kiến thức: "${game?.title}".\n👉 Nhấn vào đường dẫn này để bắt đầu chơi và thi đua điểm số ngay:\n${directUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      window.prompt('Sao chép đường dẫn:', directUrl);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageTemplate);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      window.prompt('Sao chép thông điệp gửi lớp:', messageTemplate);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 text-white relative ${
          type === 'task' 
            ? 'bg-gradient-to-r from-emerald-800 to-teal-800' 
            : 'bg-gradient-to-r from-purple-800 to-indigo-900'
        }`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/30 shadow-inner">
              {type === 'task' ? <BookOpen className="w-6 h-6 text-emerald-200" /> : <Gamepad2 className="w-6 h-6 text-purple-200" />}
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 bg-black/20 rounded-full text-[10px] font-bold tracking-wider uppercase text-white/90 border border-white/20">
                {type === 'task' ? 'Xuất Link Nhiệm Vụ Học Tập' : 'Xuất Link Trò Chơi Củng Cố'}
              </span>
              <h3 className="font-display font-bold text-lg text-white leading-tight mt-1 line-clamp-1">
                {item.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Verification Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mục tiêu liên kết:</span>
              <span className="font-bold text-slate-800">
                {type === 'task' ? 'Nhiệm vụ học tập' : 'Trò chơi tương tác'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lớp áp dụng:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Lớp {item.classIds.join(', ')} ({item.grade})
              </span>
            </div>
            {task && (
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Thời gian nộp bài:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {task.startDate ? `Từ ${new Date(task.startDate).toLocaleString('vi-VN')} ` : ''}
                  đến {task.endDate || task.deadline ? new Date(task.endDate || task.deadline).toLocaleString('vi-VN') : 'Không giới hạn'}
                </span>
              </div>
            )}
          </div>

          {/* Exact URL Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đường dẫn trực tiếp cho học sinh (Đúng địa chỉ {type === 'task' ? 'nhiệm vụ' : 'trò chơi'}):</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                ✓ Tự động mở đúng bài
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl select-all focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-800"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Chép link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Học sinh bấm vào link sẽ vào thẳng trực tiếp bài <strong>{item.title}</strong>, không phải bấm chọn hay đăng nhập.
            </p>
          </div>

          {/* Action Buttons: Preview & Show QR */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                onShowQR(type, item.id, item.title, `Lớp: ${item.classIds.join(', ')}`);
                onClose();
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Chiếu Mã QR Lên Bảng</span>
            </button>

            <button
              onClick={() => {
                onOpenPreview(type, item.id);
                onClose();
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-purple-700" />
              <span>Mở Thử Trang Học Sinh</span>
            </button>
          </div>

          {/* Template for Zalo / Messenger message */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Mẫu tin nhắn gửi nhóm Zalo / Lớp học:</span>
              </label>
              <button
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMessage ? 'Đã sao chép tin nhắn!' : 'Sao chép toàn bộ tin nhắn'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={messageTemplate}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600 focus:outline-hidden font-sans leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
