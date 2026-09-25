import React, { useState } from 'react';
import { Classroom, Task, Submission } from '../types';
import { 
  BookOpen, 
  Plus, 
  QrCode, 
  Copy, 
  Share2, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit,
  ExternalLink,
  Calendar,
  Check,
  Award,
  Lock,
  Link as LinkIcon
} from 'lucide-react';
import { storage } from '../services/storage';
import { ExportLinkModal } from './ExportLinkModal';
import { generateTaskDirectUrl } from '../services/taskLink';

interface TaskManagementProps {
  tasks: Task[];
  classes: Classroom[];
  submissions: Submission[];
  selectedClassFilter?: string;
  onOpenCreateTask: (taskToEdit?: Task) => void;
  onShowQR: (type: 'task' | 'game' | 'class', id: string, title: string, subtitle?: string) => void;
  onOpenSubmissionPreview: (submission: Submission) => void;
  onRefresh: () => void;
  isOwner?: boolean;
  onRequestLogin?: () => void;
  onOpenStudentTaskPreview?: (taskId: string) => void;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({
  tasks,
  classes,
  submissions,
  selectedClassFilter,
  onOpenCreateTask,
  onShowQR,
  onOpenSubmissionPreview,
  onRefresh,
  isOwner = false,
  onRequestLogin,
  onOpenStudentTaskPreview,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(selectedClassFilter || 'ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [exportModalTask, setExportModalTask] = useState<Task | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedClass !== 'ALL' && !t.classIds.includes(selectedClass)) return false;
    if (selectedGrade !== 'ALL' && t.grade !== selectedGrade) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.lessonTopic.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLink = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    const url = generateTaskDirectUrl(taskId, task);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTaskId(taskId);
      setTimeout(() => setCopiedTaskId(null), 2000);
    } catch {
      window.prompt('Sao chép đường dẫn nhiệm vụ:', url);
    }
  };

  const handleShare = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateTaskDirectUrl(task.id, task);
    if (navigator.share) {
      try {
        await navigator.share({
          title: task.title,
          text: `Nhiệm vụ học tập: ${task.title} - Lớp Học Số Cô Dung`,
          url: url,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink(task.id, e);
    }
  };

  const handleCreateTaskClick = () => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    onOpenCreateTask();
  };

  const handleEditTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    onOpenCreateTask(task);
  };

  const handleDeleteTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (window.confirm(`Xóa nhiệm vụ: "${task.title}"? Các bài học sinh đã nộp vẫn sẽ được giữ lại trong kho.`)) {
      storage.deleteTask(task.id);
      onRefresh();
    }
  };

  const handleDownloadSingleFile = (sub: Submission, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sub.fileData) {
      const a = document.createElement('a');
      a.href = sub.fileData;
      a.download = sub.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`Đang chuẩn bị tải về bài nộp của ${sub.studentName}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Hệ thống giao bài & thu nộp số</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            Quản Lý Nhiệm Vụ Học Tập
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo nhiệm vụ, xuất link & QR tức thì, và theo dõi trực tiếp bài nộp của học sinh ngay trong mỗi nhiệm vụ.
          </p>
        </div>

        <button
          onClick={handleCreateTaskClick}
          className={`inline-flex items-center gap-2 px-5 py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 hover:scale-[1.02] ${
            isOwner ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'
          }`}
          title={isOwner ? 'Tạo nhiệm vụ học tập mới' : 'Đăng nhập chủ tài khoản để tạo nhiệm vụ'}
        >
          {isOwner ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-300" />}
          <span>+ TẠO NHIỆM VỤ MỚI</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-slate-400 pl-2 pr-1 font-medium">Lớp:</span>
            <button
              onClick={() => setSelectedClass('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedClass === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedClass === c.id ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.id}
              </button>
            ))}
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-slate-400 pl-2 pr-1 font-medium">Khối:</span>
            {['ALL', 'Khối 10', 'Khối 11', 'Khối 12'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedGrade === g ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'ALL' ? 'Tất cả khối' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhiệm vụ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">Chưa có nhiệm vụ nào phù hợp</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Hãy thử chọn bộ lọc lớp khác hoặc nhấn nút "+ TẠO NHIỆM VỤ MỚI" ở trên.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskSubs = submissions.filter((s) => s.taskId === task.id);
            const isExpanded = expandedTaskId === task.id;
            const isCopied = copiedTaskId === task.id;

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Task Header Summary Row */}
                <div
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors border-b border-transparent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {task.grade}
                      </span>
                      <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Lớp: {task.classIds.join(', ')}
                      </span>
                      <span className="text-slate-400 font-medium">·</span>
                      <span className="text-slate-500">{task.subject}</span>
                      {task.lessonTopic && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 font-medium truncate max-w-xs">{task.lessonTopic}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {task.title}
                    </h3>

                    {/* Time Window with From Date-Time to To Date-Time */}
                    {(() => {
                      const now = new Date();
                      const start = task.startDate ? new Date(task.startDate) : null;
                      const end = task.endDate ? new Date(task.endDate) : (task.deadline ? new Date(task.deadline) : null);
                      const isBefore = start ? now.getTime() < start.getTime() : false;
                      const isAfter = end ? now.getTime() > end.getTime() : false;
                      const isOpen = !isBefore && !isAfter;

                      return (
                        <div className="flex flex-wrap items-center gap-3 text-xs mt-2.5">
                          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Hạn nộp: Từ <strong>{task.startDate ? new Date(task.startDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Bắt đầu ngay'}</strong>
                              {' '}→ Đến <strong>{task.endDate || task.deadline ? new Date(task.endDate || task.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không giới hạn'}</strong>
                            </span>
                          </div>

                          {isBefore && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                              Chưa mở
                            </span>
                          )}
                          {isOpen && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Đang mở nhận bài
                            </span>
                          )}
                          {isAfter && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              Đã hết hạn
                            </span>
                          )}

                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{taskSubs.length} học sinh đã nộp</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action Buttons as requested */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Primary Export Link Button as requested */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportModalTask(task);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer shadow-xs"
                      title="Xuất link trực tiếp đúng địa chỉ nhiệm vụ này gửi cho học sinh"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>XUẤT LINK</span>
                    </button>

                    <button
                      onClick={(e) => handleCopyLink(task.id, e)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Sao chép nhanh đường dẫn nộp bài"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 text-[11px]">Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Chép link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onShowQR('task', task.id, task.title, `Lớp áp dụng: ${task.classIds.join(', ')}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors cursor-pointer"
                      title="Chiếu mã QR lên máy chiếu để học sinh quét"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-[11px]">QR</span>
                    </button>

                    <button
                      onClick={(e) => handleShare(task, e)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Chia sẻ"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleEditTaskClick(task, e)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={isOwner ? "Chỉnh sửa nhiệm vụ" : "Đăng nhập chủ tài khoản để chỉnh sửa"}
                    >
                      {isOwner ? <Edit className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-400" />}
                    </button>

                    <button
                      onClick={(e) => handleDeleteTask(task, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={isOwner ? "Xóa nhiệm vụ" : "Đăng nhập chủ tài khoản để xóa"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">
                    {/* Task Content Specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-700 mb-1">Mục tiêu & Yêu cầu:</div>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                          {task.requirements || task.objective}
                        </p>
                      </div>
                      <div>
                        <div className="font-bold text-slate-700 mb-1">Hướng dẫn & Định dạng cho phép:</div>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                          {task.instructions || 'Chưa có hướng dẫn bổ sung.'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {task.allowedFileTypes.map((ft) => (
                            <span key={ft} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium uppercase">
                              {ft}
                            </span>
                          ))}
                        </div>
                      </div>
                      {task.teacherNote && (
                        <div className="md:col-span-2 pt-2 border-t border-slate-100 text-emerald-800">
                          <span className="font-bold">Ghi chú từ Cô Dung: </span>
                          <span>{task.teacherNote}</span>
                        </div>
                      )}
                    </div>

                    {/* CRITICAL REQUIREMENT 12: DANH SÁCH BÀI HỌC SINH ĐÃ NỘP NGAY TRONG NHIỆM VỤ */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wide">
                            DANH SÁCH BÀI HỌC SINH ĐÃ NỘP ({taskSubs.length})
                          </h4>
                          <span className="text-xs text-slate-400">
                            (Liên kết trực tiếp: Lớp → Nhiệm vụ → Học sinh → Bài nộp)
                          </span>
                        </div>
                        <span className="text-xs text-emerald-700 font-semibold">
                          {taskSubs.filter((s) => s.status === 'reviewed').length} / {taskSubs.length} bài đã chấm
                        </span>
                      </div>

                      {taskSubs.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700">Chưa có học sinh nào nộp bài cho nhiệm vụ này.</p>
                          <p className="text-slate-400 mt-1">
                            Hãy nhấn nút <strong>"HIỂN THỊ QR"</strong> hoặc <strong>"SAO CHÉP LINK"</strong> để gửi cho lớp.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <tr>
                                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                                <th className="py-2.5 px-4">Học sinh</th>
                                <th className="py-2.5 px-3">Lớp</th>
                                <th className="py-2.5 px-4">Bài nộp</th>
                                <th className="py-2.5 px-3">Thời gian</th>
                                <th className="py-2.5 px-3">Trạng thái</th>
                                <th className="py-2.5 px-4 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {taskSubs.map((sub, index) => {
                                const isReviewed = sub.status === 'reviewed';
                                return (
                                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                      {index + 1}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-900">
                                      {sub.studentName}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                        {sub.studentClass}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div className="truncate max-w-xs font-medium text-slate-800" title={sub.fileName}>
                                          {sub.fileName}
                                        </div>
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">{sub.fileSize}</div>
                                    </td>
                                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                                      {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                                      <span className="text-[10px] text-slate-400 block">
                                        {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                      {isReviewed ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <Check className="w-3 h-3" />
                                          <span>Đã chấm ({sub.score}đ)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                          <Clock className="w-3 h-3" />
                                          <span>Đã nộp</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => onOpenSubmissionPreview(sub)}
                                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                                          title="Xem bài và nhận xét/chấm điểm"
                                        >
                                          [XEM]
                                        </button>
                                        <button
                                          onClick={() => onOpenSubmissionPreview(sub)}
                                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                                          title="Mở toàn bộ bài nộp"
                                        >
                                          [MỞ BÀI]
                                        </button>
                                        <button
                                          onClick={(e) => handleDownloadSingleFile(sub, e)}
                                          className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                                          title="Tải về máy tính"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Export Link Modal */}
      <ExportLinkModal
        isOpen={Boolean(exportModalTask)}
        onClose={() => setExportModalTask(null)}
        type="task"
        item={exportModalTask}
        onShowQR={onShowQR}
        onOpenPreview={(type, id) => {
          if (onOpenStudentTaskPreview) {
            onOpenStudentTaskPreview(id);
          }
        }}
      />
    </div>
  );
};
