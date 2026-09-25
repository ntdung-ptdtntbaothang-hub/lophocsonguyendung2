import React, { useState, useEffect } from 'react';
import { Classroom, Task, Submission } from '../types';
import { 
  BookOpen, 
  Upload, 
  CheckCircle2, 
  FileText, 
  User, 
  School, 
  Calendar, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  GraduationCap,
  Clock,
  Check,
  Star,
  Trophy,
  Download,
  Eye,
  FileCheck,
  Send
} from 'lucide-react';
import { storage } from '../services/storage';
import { decodeTaskFromUrl } from '../services/taskLink';
import confetti from 'canvas-confetti';

interface StudentTaskViewProps {
  tasks: Task[];
  classes: Classroom[];
  initialTaskId?: string;
  onBackToTeacher?: () => void;
  onSubmissionSuccess?: () => void;
  onOpenStudentPortal?: (studentId?: string, classId?: string) => void;
}

export const StudentTaskView: React.FC<StudentTaskViewProps> = ({
  tasks,
  classes,
  initialTaskId,
  onBackToTeacher,
  onSubmissionSuccess,
  onOpenStudentPortal,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || tasks[0]?.id || '');
  const [isLoadingDirectTask, setIsLoadingDirectTask] = useState<boolean>(
    Boolean(initialTaskId && !tasks.some((t) => t.id === initialTaskId))
  );
  const [notFoundDirectTask, setNotFoundDirectTask] = useState<boolean>(false);

  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('10A');
  const [note, setNote] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSubmission, setSubmittedSubmission] = useState<Submission | null>(null);

  // Live submissions on this active task
  const [taskSubmissions, setTaskSubmissions] = useState<Submission[]>([]);

  // Update selectedTaskId and fetch from server or URL if initialTaskId provided
  useEffect(() => {
    if (initialTaskId) {
      // 1. Check if already in loaded tasks
      const found = tasks.find((t) => t.id === initialTaskId);
      if (found) {
        setSelectedTaskId(found.id);
        setIsLoadingDirectTask(false);
        setNotFoundDirectTask(false);
        return;
      }

      // 2. Check if tdata is in URL
      const params = new URLSearchParams(window.location.search);
      const tdata = params.get('tdata');
      if (tdata) {
        const decoded = decodeTaskFromUrl(tdata);
        if (decoded && decoded.id === initialTaskId) {
          storage.saveTask(decoded);
          setSelectedTaskId(decoded.id);
          setIsLoadingDirectTask(false);
          setNotFoundDirectTask(false);
          return;
        }
      }

      // 3. Fallback to server query
      setIsLoadingDirectTask(true);
      storage.fetchTaskById(initialTaskId).then((fetched) => {
        setIsLoadingDirectTask(false);
        if (fetched) {
          setSelectedTaskId(fetched.id);
          setNotFoundDirectTask(false);
        } else {
          setNotFoundDirectTask(true);
        }
      });
    } else if (!selectedTaskId && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [initialTaskId, tasks]);

  // If initialTaskId is specified, strictly prefer it over defaulting to demo task
  const activeTask = tasks.find((t) => t.id === selectedTaskId) || (initialTaskId ? undefined : tasks[0]);

  // Refresh active task submissions whenever active task or storage changes
  useEffect(() => {
    if (activeTask) {
      setTaskSubmissions(storage.getSubmissionsByTaskId(activeTask.id));
    }
  }, [activeTask?.id, submittedSubmission, tasks]);

  const classStudents = storage.getStudentsByClass(studentClass);

  // Time window calculations
  const now = new Date();
  const startTime = activeTask?.startDate ? new Date(activeTask.startDate) : null;
  const endTime = activeTask?.endDate 
    ? new Date(activeTask.endDate) 
    : (activeTask?.deadline ? new Date(activeTask.deadline) : null);

  const isBeforeStart = startTime ? now.getTime() < startTime.getTime() : false;
  const isAfterEnd = endTime ? now.getTime() > endTime.getTime() : false;
  const isOpenForSubmission = !isBeforeStart && !isAfterEnd;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setFilePreview(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass || !selectedFile || !activeTask) return;

    if (isBeforeStart) {
      alert(`Chưa đến thời gian nộp bài! Hệ thống mở nhận bài từ: ${startTime?.toLocaleString('vi-VN')}`);
      return;
    }

    setIsSubmitting(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const sizeStr = (selectedFile.size / 1024).toFixed(1) + ' KB';

      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        studentName: studentName.trim(),
        studentClass: studentClass,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'Tài liệu',
        fileSize: sizeStr,
        fileData: dataUrl,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      };

      storage.saveSubmission(newSubmission);
      setIsSubmitting(false);
      setSubmittedSubmission(newSubmission);

      // Prepend to local submissions immediately
      setTaskSubmissions((prev) => [newSubmission, ...prev.filter((s) => s.id !== newSubmission.id)]);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }

      // Scroll smoothly to the live submission section
      setTimeout(() => {
        const el = document.getElementById('my-recent-submission');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    };

    reader.readAsDataURL(selectedFile);
  };

  const isExactDirectLink = Boolean(initialTaskId && initialTaskId === activeTask?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-teal-50/30 text-slate-800 pb-20 font-sans">
      {/* Student View Banner Header */}
      <div className="bg-emerald-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-white border border-emerald-500/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm sm:text-base leading-tight">
                LỚP HỌC SỐ – CÔ GIÁO NGUYỄN THỊ DUNG
              </h1>
              <p className="text-[11px] text-emerald-200">
                Cổng nộp bài học sinh · Không yêu cầu đăng nhập mật khẩu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenStudentPortal && (
              <button
                onClick={() => onOpenStudentPortal(undefined, studentClass)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium transition-colors cursor-pointer border border-emerald-600/40"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Xem Sổ Điểm Cá Nhân</span>
                <span className="sm:hidden">Sổ điểm</span>
              </button>
            )}

            {onBackToTeacher && (
              <button
                onClick={onBackToTeacher}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer border border-white/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Về Giao diện Giáo viên</span>
                <span className="sm:hidden">Giáo viên</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Loading state for direct link */}
        {isLoadingDirectTask && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-slate-800">Đang tải đúng nhiệm vụ theo liên kết...</h3>
            <p className="text-xs text-slate-500 mt-1">Hệ thống đang đồng bộ dữ liệu bài tập trực tiếp từ máy chủ.</p>
          </div>
        )}

        {/* Not found state for direct link */}
        {notFoundDirectTask && !activeTask && (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-xs max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Không tìm thấy nhiệm vụ học tập theo link</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Nhiệm vụ với mã <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-700 font-mono font-bold">{initialTaskId}</code> hiện chưa có trên hệ thống hoặc đã được cập nhật. Em hãy liên hệ Cô Dung để nhận lại link mới nhé!
              </p>
            </div>
            {tasks.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedTaskId(tasks[0].id);
                    setNotFoundDirectTask(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Xem danh sách bài tập hiện có
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verification banner if direct task link */}
        {activeTask && isExactDirectLink && (
          <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Bạn đang truy cập trực tiếp nhiệm vụ được giao: <strong>{activeTask?.title}</strong>
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
              Đúng địa chỉ nhiệm vụ
            </span>
          </div>
        )}

        {/* Task Selector if multiple tasks & not locked by direct URL */}
        {activeTask && tasks.length > 1 && !isExactDirectLink && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-bold text-slate-700 shrink-0">
              Chọn nhiệm vụ cần thực hiện:
            </label>
            <select
              value={activeTask?.id}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                setSubmittedSubmission(null);
              }}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.grade}] {t.title} ({t.classIds.join(', ')})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Success Alert Banner when submitted */}
        {submittedSubmission && (
          <div 
            id="my-recent-submission"
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 shadow-md animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Đã Nộp Bài Thành Công!
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(submittedSubmission.submittedAt).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 mt-0.5">
                    Bài của em đã được ghi nhận ngay trên nhiệm vụ này
                  </h3>
                </div>
              </div>

              {onOpenStudentPortal && (
                <button
                  onClick={() => {
                    const matched = storage.getStudentByCodeOrName(submittedSubmission.studentClass, submittedSubmission.studentName);
                    onOpenStudentPortal(matched?.id, submittedSubmission.studentClass);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>Xem Sổ Điểm Của Em</span>
                </button>
              )}
            </div>

            {/* Receipt metadata & points feedback */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                <div className="text-slate-400 text-[11px]">Học sinh & Lớp</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {submittedSubmission.studentName} – Lớp {submittedSubmission.studentClass}
                </div>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                <div className="text-slate-400 text-[11px]">Tệp bài làm đã nộp</div>
                <div className="font-semibold text-emerald-800 text-sm mt-0.5 truncate" title={submittedSubmission.fileName}>
                  {submittedSubmission.fileName} ({submittedSubmission.fileSize})
                </div>
              </div>
              <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-xs">
                <div className="text-emerald-100 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Điểm chuyên cần</span>
                </div>
                <div className="font-extrabold text-sm mt-0.5">
                  +10 Điểm đã cộng vào tài khoản!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Task details & Submission Form */}
        {activeTask && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Task Specs & Time Range */}
            <div className="lg:col-span-7 space-y-6">
            {activeTask && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {activeTask.grade}
                    </span>
                    <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                      Lớp: {activeTask.classIds.join(', ')}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 font-medium">{activeTask.subject}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-2 leading-tight">
                    {activeTask.title}
                  </h2>

                  {activeTask.lessonTopic && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Chủ đề bài học: {activeTask.lessonTopic}
                    </p>
                  )}
                </div>

                {/* HẠN NỘP BÀI: TỪ NGÀY - GIỜ ĐẾN NGÀY - GIỜ */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs transition-colors ${
                  isBeforeStart
                    ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                    : isAfterEnd
                    ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                }`}>
                  <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isBeforeStart ? 'text-amber-600' : isAfterEnd ? 'text-rose-600' : 'text-emerald-700'
                  }`} />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold uppercase tracking-wide text-[11px]">
                        Khoảng thời gian nộp bài:
                      </span>
                      {isBeforeStart && (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md font-bold text-[10px]">
                          ⏳ CHƯA ĐẾN GIỜ MỞ NỘP
                        </span>
                      )}
                      {isOpenForSubmission && (
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md font-bold text-[10px] animate-pulse">
                          🟢 ĐANG MỞ NHẬN BÀI
                        </span>
                      )}
                      {isAfterEnd && (
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-md font-bold text-[10px]">
                          ⚠️ ĐÃ HẾT HẠN NỘP
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-black/5">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Từ ngày - giờ:</span>
                        <strong className="text-slate-800">
                          {activeTask.startDate 
                            ? new Date(activeTask.startDate).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) 
                            : 'Bắt đầu ngay'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Đến ngày - giờ:</span>
                        <strong className="text-slate-800">
                          {activeTask.endDate || activeTask.deadline 
                            ? new Date(activeTask.endDate || activeTask.deadline).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) 
                            : 'Không giới hạn'}
                        </strong>
                      </div>
                    </div>

                    {isBeforeStart && (
                      <p className="text-[11px] text-amber-800 font-medium pt-1">
                        Hệ thống chỉ mở nhận bài trong khoảng thời gian trên. Em hãy chuẩn bị bài trước nhé!
                      </p>
                    )}
                    {isAfterEnd && (
                      <p className="text-[11px] text-rose-800 font-medium pt-1">
                        Nhiệm vụ đã quá hạn chót. Nếu em nộp bây giờ, bài nộp vẫn được gửi tới cô giáo và ghi nhận kèm trạng thái nộp muộn.
                      </p>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Yêu cầu nhiệm vụ:</span>
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeTask.requirements || activeTask.objective}
                  </div>
                </div>

                {/* Instructions */}
                {activeTask.instructions && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                      Hướng dẫn làm bài & nộp bài:
                    </h3>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      {activeTask.instructions}
                    </div>
                  </div>
                )}

                {/* Allowed formats */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                    Định dạng file cho phép:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTask.allowedFileTypes.map((ft) => (
                      <span key={ft} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                        ✓ {ft.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Teacher's Note */}
                {activeTask.teacherNote && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                    <strong>Lời dặn của Cô Dung: </strong>
                    {activeTask.teacherNote}
                  </div>
                )}
              </div>
            )}

            {/* REAL-TIME SUBMISSIONS FEED ON ACTIVE TASK */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                      BÀI HỌC SINH ĐÃ NỘP TRÊN NHIỆM VỤ NÀY
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hiển thị ngay lập tức danh sách các bạn đã nộp bài thành công ({taskSubmissions.length} bài)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  {taskSubmissions.length} bài đã nộp
                </span>
              </div>

              {taskSubmissions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600">Chưa có bài nộp nào cho nhiệm vụ này.</p>
                  <p className="text-[11px] mt-1">Hãy là người đầu tiên hoàn thành và nộp bài nhé!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {taskSubmissions.map((sub, idx) => {
                    const isJustSubmitted = submittedSubmission?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        className={`py-3 px-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                          isJustSubmitted ? 'bg-emerald-50/90 border border-emerald-300 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-slate-400 w-5 text-center">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {sub.studentName}
                              </span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                                {sub.studentClass}
                              </span>
                              {isJustSubmitted && (
                                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[10px] font-bold">
                                  Bài của bạn vừa nộp
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                              <span className="text-emerald-700 truncate">{sub.fileName}</span>
                              <span>·</span>
                              <span>{new Date(sub.submittedAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sub.status === 'reviewed' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              Đã chấm: {sub.score}/10đ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Đã nhận bài</span>
                            </span>
                          )}

                          {sub.fileData && (
                            <a
                              href={sub.fileData}
                              download={sub.fileName}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Tải về bài đã nộp"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Submission Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-lg sticky top-20">
              <div className="mb-5 pb-4 border-b border-slate-100">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>NỘP BÀI NHANH</span>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Thông Tin & Tải Bài Nộp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ cần nhập Họ tên và Lớp, không cần mật khẩu hay đăng nhập Google.
                </p>
              </div>

              {/* Time window status notice inside form */}
              {isBeforeStart && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Chưa mở nhận bài:</strong> Nhiệm vụ sẽ mở nhận bài từ{' '}
                    <strong>{startTime?.toLocaleString('vi-VN')}</strong>.
                  </div>
                </div>
              )}

              {isAfterEnd && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Đã hết hạn:</strong> Hạn chót là{' '}
                    <strong>{endTime?.toLocaleString('vi-VN')}</strong>. Bài nộp của em sẽ được ghi nhận là nộp muộn.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên học sinh <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      list="task-student-names"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A (hoặc chọn tên trong danh sách)"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    />
                    <datalist id="task-student-names">
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.studentCode ? `${s.studentCode} - ${s.name}` : s.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Student Class */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp học <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
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
                  const matchedInForm = classStudents.find(
                    (s) => s.name.toLowerCase().trim() === studentName.toLowerCase().trim()
                  );
                  if (!matchedInForm) return null;
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Tài khoản: {matchedInForm.name}</span>
                        </div>
                        <span className="text-[11px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                          {matchedInForm.studentCode || 'HS-SO'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-emerald-700">
                        <span>Điểm hiện tại: <strong>{matchedInForm.totalScore || 0}đ</strong> (Hạng #{matchedInForm.rankInClass || 1})</span>
                        <span className="font-semibold text-emerald-800">+10đ khi nộp bài</span>
                      </div>
                    </div>
                  );
                })()}

                {/* File Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn tệp bài làm <span className="text-rose-500">*</span>
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors block">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-xs font-bold text-slate-700">
                      {selectedFile ? selectedFile.name : 'Bấm để chọn tệp hoặc kéo thả vào đây'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : 'Word (.docx), PDF, PowerPoint, Ảnh (JPG, PNG)'}
                    </span>
                    <input
                      type="file"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {filePreview && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <img
                        src={filePreview}
                        alt="Xem trước ảnh"
                        className="max-h-32 mx-auto rounded-lg object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Student Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú thêm gửi cô (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Em đã hoàn thành phần vẽ sơ đồ tư duy..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedFile || !studentName.trim() || isBeforeStart}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Đang tải bài nộp lên...</span>
                    ) : isBeforeStart ? (
                      <span>⏳ Chưa đến giờ nộp bài</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isAfterEnd ? 'HOÀN THÀNH & NỘP BÀI (MUỘN)' : 'HOÀN THÀNH & NỘP BÀI NGAY'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
