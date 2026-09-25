import React, { useState } from 'react';
import { Classroom, Task, Submission } from '../types';
import { 
  Inbox, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldCheck,
  ChevronRight,
  School,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';

interface SubmissionsRepositoryProps {
  classes: Classroom[];
  tasks: Task[];
  submissions: Submission[];
  selectedClassFilter?: string;
  onOpenSubmissionPreview: (submission: Submission) => void;
}

export const SubmissionsRepository: React.FC<SubmissionsRepositoryProps> = ({
  classes,
  tasks,
  submissions,
  selectedClassFilter,
  onOpenSubmissionPreview,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(selectedClassFilter || 'ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'submitted' | 'reviewed'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'score'>('newest');

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedClass !== 'ALL' && !sub.studentClass.includes(selectedClass)) return false;
    if (selectedTaskId !== 'ALL' && sub.taskId !== selectedTaskId) return false;
    if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        sub.studentName.toLowerCase().includes(q) ||
        sub.fileName.toLowerCase().includes(q) ||
        sub.taskTitle.toLowerCase().includes(q) ||
        sub.studentClass.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
    return 0;
  });

  const handleExportCSV = () => {
    const headers = ['STT', 'Họ và tên học sinh', 'Lớp', 'Nhiệm vụ', 'Tên tệp', 'Dung lượng', 'Thời gian nộp', 'Trạng thái', 'Điểm số', 'Nhận xét'];
    const rows = filteredSubmissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.taskTitle.replace(/"/g, '""')}"`,
      `"${s.fileName}"`,
      `"${s.fileSize}"`,
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`,
      s.status === 'reviewed' ? 'Đã chấm' : 'Đã nộp',
      s.score ?? '',
      `"${(s.teacherFeedback || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Bai_Nop_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reviewedCount = filteredSubmissions.filter(s => s.status === 'reviewed').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase">
            <Inbox className="w-4 h-4" />
            <span>Kho Lưu Trữ Bài Nộp Số</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            📚 Kho Bài Nộp Của Học Sinh
          </h2>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700">Cấu trúc:</span>
            <span>LỚP</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>BÀI HỌC / NHIỆM VỤ</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>HỌC SINH</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>BÀI NỘP</span>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Xuất Bảng Điểm (Excel / CSV)</span>
        </button>
      </div>

      {/* Preservation Assurance Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">Lưu Trữ Lâu Dài & An Toàn Dữ Liệu</div>
            <div className="text-emerald-700 text-[11px]">
              Hệ thống không tự động xóa bài tập hoặc bài học sinh. Mọi bài nộp được bảo toàn và giáo viên có thể tra cứu bất cứ lúc nào.
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <span className="font-bold tabular-nums">{submissions.length}</span> bài nộp trong kho
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Class Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium px-1">Lớp:</span>
            <button
              onClick={() => setSelectedClass('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedClass === 'ALL' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả lớp
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedClass === cls.id ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls.id}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm học sinh, lớp, tên file, nhiệm vụ..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* Second Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Task */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Nhiệm vụ:</span>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white outline-hidden max-w-xs truncate"
              >
                <option value="ALL">Tất cả nhiệm vụ ({tasks.length})</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white outline-hidden"
              >
                <option value="ALL">Tất cả ({submissions.length})</option>
                <option value="submitted">Chưa chấm</option>
                <option value="reviewed">Đã chấm</option>
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white outline-hidden"
            >
              <option value="newest">Thời gian: Mới nhất</option>
              <option value="oldest">Thời gian: Cũ nhất</option>
              <option value="name">Tên học sinh (A-Z)</option>
              <option value="score">Điểm số cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span>Tìm thấy: <strong>{filteredSubmissions.length}</strong> bài nộp</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">{reviewedCount} bài đã chấm điểm</span>
          </div>
          <span className="text-slate-400 text-[11px]">Học sinh THPT nộp trực tiếp qua link/QR</span>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">Không tìm thấy bài nộp nào phù hợp</p>
            <p className="mt-1">Thử thay đổi bộ lọc lớp, nhiệm vụ hoặc tìm kiếm theo tên khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-3">Lớp</th>
                  <th className="py-3 px-4">Nhiệm vụ liên kết</th>
                  <th className="py-3 px-4">Tệp bài nộp</th>
                  <th className="py-3 px-3">Thời gian nộp</th>
                  <th className="py-3 px-3">Trạng thái / Điểm</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub, index) => {
                  const isReviewed = sub.status === 'reviewed';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {sub.studentName}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {sub.studentClass}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate font-medium text-slate-800" title={sub.taskTitle}>
                          {sub.taskTitle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate max-w-[180px] font-medium text-slate-700" title={sub.fileName}>
                            {sub.fileName}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.fileSize}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isReviewed ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{sub.score !== undefined ? `${sub.score} điểm` : 'Đã chấm'}</span>
                            </span>
                            {sub.teacherFeedback && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5" title={sub.teacherFeedback}>
                                {sub.teacherFeedback}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Chưa xem</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenSubmissionPreview(sub)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            [Xem bài]
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
  );
};
