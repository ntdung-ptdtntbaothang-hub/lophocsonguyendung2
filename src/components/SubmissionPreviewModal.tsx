import React, { useState } from 'react';
import { Submission } from '../types';
import { X, Download, Check, FileText, Calendar, User, School, Sparkles, MessageSquare, Star, Lock } from 'lucide-react';
import { storage } from '../services/storage';

interface SubmissionPreviewModalProps {
  submission: Submission | null;
  onClose: () => void;
  onUpdated: () => void;
  isOwner?: boolean;
  onRequestLogin?: () => void;
}

export const SubmissionPreviewModal: React.FC<SubmissionPreviewModalProps> = ({
  submission,
  onClose,
  onUpdated,
  isOwner = false,
  onRequestLogin,
}) => {
  const [score, setScore] = useState<string>(submission?.score?.toString() || '');
  const [feedback, setFeedback] = useState<string>(submission?.teacherFeedback || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!submission) return null;

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    const updated: Submission = {
      ...submission,
      score: score ? Number(score) : undefined,
      teacherFeedback: feedback.trim(),
      status: 'reviewed',
    };
    storage.updateSubmission(updated);
    onUpdated();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDownload = () => {
    if (submission.fileData) {
      const a = document.createElement('a');
      a.href = submission.fileData;
      a.download = submission.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create mock file
      const blob = new Blob([`Bài nộp của: ${submission.studentName} - Lớp ${submission.studentClass}\nNhiệm vụ: ${submission.taskTitle}\nThời gian: ${submission.submittedAt}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isImage = submission.fileName.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)$/i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-emerald-400">{submission.studentClass}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 font-medium">{submission.studentName}</span>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg leading-tight mt-0.5">
                Chi Tiết Bài Nộp Của Học Sinh
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Tải file về máy tính"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Học sinh:</span>
              <span className="font-bold text-slate-800 text-sm">{submission.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lớp:</span>
              <span className="font-bold text-slate-800 text-sm">{submission.studentClass}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Thời gian nộp:</span>
              <span className="font-medium text-slate-700">
                {new Date(submission.submittedAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Dung lượng / Loại:</span>
              <span className="font-medium text-slate-700">{submission.fileSize}</span>
            </div>
          </div>

          {/* Task reference */}
          <div className="text-xs text-slate-600 bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
            <span className="font-bold text-emerald-900">Nhiệm vụ: </span>
            <span className="text-emerald-800">{submission.taskTitle}</span>
          </div>

          {/* Document Viewer / Preview */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Xem trước nội dung ({submission.fileName})</span>
              </span>
              <button
                onClick={handleDownload}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file gốc</span>
              </button>
            </div>

            {isImage && submission.fileData ? (
              <div className="rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-2 max-h-96">
                <img
                  src={submission.fileData}
                  alt={submission.fileName}
                  className="max-h-80 object-contain rounded-lg shadow-2xs"
                />
              </div>
            ) : (
              <div className="bg-white p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {submission.fileData && submission.fileData.startsWith('data:text')
                  ? decodeURIComponent(submission.fileData.split(',')[1] || '')
                  : `Tên tệp tin: ${submission.fileName}\nĐịnh dạng: ${submission.fileType || 'Tài liệu học tập'}\nDung lượng: ${submission.fileSize}\n\n[Nội dung tài liệu học sinh đã nộp được lưu trữ an toàn trong hệ thống Lớp Học Số.]`}
              </div>
            )}
          </div>

          {/* Teacher Feedback & Scoring Section */}
          <form onSubmit={handleSaveFeedback} className="bg-white border-2 border-emerald-500/20 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Nhận Xét & Đánh Giá Của Giáo Viên</span>
              </h4>
              {submission.status === 'reviewed' && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Đã chấm điểm
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Điểm số (Thang 10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="VD: 9.5"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold text-emerald-800"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lời nhận xét, động viên học sinh
                </label>
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="VD: Bài làm rất tốt, sơ đồ tư duy rõ ràng, lập luận chặt chẽ!"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Nhận xét giúp khích lệ tinh thần học tập của học sinh
              </span>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Đã lưu nhận xét!</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 text-amber-300" />
                    <span>Lưu Đánh Giá & Điểm</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
