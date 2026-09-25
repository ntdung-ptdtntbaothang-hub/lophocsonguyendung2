import React, { useState } from 'react';
import { Classroom, Task, AllowedFileType } from '../types';
import { X, Check, BookOpen, Calendar, FileCheck, Layers, Sparkles } from 'lucide-react';
import { storage } from '../services/storage';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  onTaskCreated: (newTask: Task) => void;
  initialTask?: Task | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  classes,
  onTaskCreated,
  initialTask,
}) => {
  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultStart = initialTask?.startDate || formatDatetimeLocal(new Date());
  const defaultEnd = initialTask?.endDate || initialTask?.deadline || formatDatetimeLocal(new Date(Date.now() + 7 * 86400000));

  const [title, setTitle] = useState(initialTask?.title || '');
  const [subject, setSubject] = useState(initialTask?.subject || 'Tin học');
  const [grade, setGrade] = useState(initialTask?.grade || 'Khối 10');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialTask?.classIds || ['10A']);
  const [lessonTopic, setLessonTopic] = useState(initialTask?.lessonTopic || '');
  const [objective, setObjective] = useState(initialTask?.objective || '');
  const [requirements, setRequirements] = useState(initialTask?.requirements || '');
  const [instructions, setInstructions] = useState(initialTask?.instructions || '');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [allowedFileTypes, setAllowedFileTypes] = useState<AllowedFileType[]>(
    initialTask?.allowedFileTypes || ['word', 'pdf', 'image']
  );
  const [teacherNote, setTeacherNote] = useState(initialTask?.teacherNote || '');

  if (!isOpen) return null;

  const handleToggleClass = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      if (selectedClasses.length > 1) {
        setSelectedClasses(selectedClasses.filter((c) => c !== classId));
      }
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const handleToggleFileType = (type: AllowedFileType) => {
    if (allowedFileTypes.includes(type)) {
      if (allowedFileTypes.length > 1) {
        setAllowedFileTypes(allowedFileTypes.filter((t) => t !== type));
      }
    } else {
      setAllowedFileTypes([...allowedFileTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeError(null);
    if (!title.trim() || selectedClasses.length === 0) return;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setTimeError('Lỗi thời gian: "Từ ngày - giờ" không được lớn hơn "Đến ngày - giờ"!');
      return;
    }

    const task: Task = {
      id: initialTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      subject: subject.trim(),
      grade,
      classIds: selectedClasses,
      lessonTopic: lessonTopic.trim(),
      objective: objective.trim(),
      requirements: requirements.trim(),
      instructions: instructions.trim(),
      startDate: startDate || formatDatetimeLocal(new Date()),
      endDate: endDate || formatDatetimeLocal(new Date(Date.now() + 7 * 86400000)),
      deadline: endDate || formatDatetimeLocal(new Date(Date.now() + 7 * 86400000)),
      allowedFileTypes,
      teacherNote: teacherNote.trim(),
      createdAt: initialTask?.createdAt || new Date().toISOString(),
      status: 'active',
    };

    storage.saveTask(task);
    onTaskCreated(task);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                {initialTask ? 'Chỉnh Sửa Nhiệm Vụ Học Tập' : '+ Tạo Nhiệm Vụ Mới Cho Học Sinh'}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Sau khi tạo, hệ thống tự động sinh link riêng và mã QR để chiếu lên bảng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên nhiệm vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nhiệm vụ 01 – Thực hành lập trình Python: Cấu trúc rẽ nhánh"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Môn học
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Tin học"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Grade & Target Classes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              >
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
                <option value="Toàn trường">Toàn trường</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp áp dụng <span className="text-rose-500">*</span> (chọn 1 hoặc nhiều lớp)
              </label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {classes.map((cls) => {
                  const isChecked = selectedClasses.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => handleToggleClass(cls.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cls.id}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lesson Topic & Objective */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên bài học / Chủ đề
            </label>
            <input
              type="text"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder="VD: Chủ đề F - Giải quyết vấn đề với sự trợ giúp của máy tính"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mục tiêu nhiệm vụ
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="VD: Viết được cú pháp if-else và lặp for trong Python để tính toán..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Requirements & Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung yêu cầu nhiệm vụ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Ghi rõ nội dung học sinh cần làm: Trả lời câu hỏi số mấy, vẽ sơ đồ, giải bài tập nào..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hướng dẫn thực hiện cho học sinh
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="VD: Đặt tên file theo cú pháp [HọTên]_[Lớp]_BaiTap. Nộp file ảnh rõ nét hoặc Word/PDF..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
            />
          </div>

          {/* Hạn nộp bài: Từ ngày - giờ đến ngày - giờ */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Thời gian nhận bài nộp (Từ ngày - giờ, đến ngày - giờ) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">Học sinh nộp bài trong khoảng này</span>
            </div>

            {timeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                ⚠️ {timeError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  1. Từ ngày - giờ (Bắt đầu mở nộp bài):
                </span>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTimeError(null);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white font-medium"
                />
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  2. Đến ngày - giờ (Hạn chót kết thúc):
                </span>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTimeError(null);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white font-medium"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setStartDate(formatDatetimeLocal(now));
                  setEndDate(formatDatetimeLocal(new Date(now.getTime() + 3 * 86400000)));
                  setTimeError(null);
                }}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 cursor-pointer"
              >
                +3 ngày
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setStartDate(formatDatetimeLocal(now));
                  setEndDate(formatDatetimeLocal(new Date(now.getTime() + 7 * 86400000)));
                  setTimeError(null);
                }}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-emerald-700 font-semibold rounded-md border border-emerald-200 bg-emerald-50/50 cursor-pointer"
              >
                +7 ngày (Chuẩn)
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setStartDate(formatDatetimeLocal(now));
                  setEndDate(formatDatetimeLocal(new Date(now.getTime() + 14 * 86400000)));
                  setTimeError(null);
                }}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 cursor-pointer"
              >
                +14 ngày
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  // end of Sunday this week 23:59
                  const day = now.getDay();
                  const diff = day === 0 ? 0 : 7 - day;
                  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 23, 59);
                  setStartDate(formatDatetimeLocal(now));
                  setEndDate(formatDatetimeLocal(sunday));
                  setTimeError(null);
                }}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 cursor-pointer"
              >
                Đến hết Chủ nhật này
              </button>
            </div>
          </div>

          {/* Allowed File Types */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Định dạng file cho phép nộp
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
                {[
                  { id: 'word', label: 'Word (.doc, .docx)' },
                  { id: 'pdf', label: 'PDF (.pdf)' },
                  { id: 'powerpoint', label: 'PowerPoint (.pptx)' },
                  { id: 'image', label: 'Hình ảnh (JPG, PNG)' },
                  { id: 'other', label: 'Khác' },
                ].map((item) => {
                  const active = allowedFileTypes.includes(item.id as AllowedFileType);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleFileType(item.id as AllowedFileType)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer border ${
                        active
                          ? 'bg-teal-50 border-teal-500 text-teal-800 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {active ? '✓ ' : ''}{item.label}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* Teacher Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú thêm từ Cô giáo
            </label>
            <input
              type="text"
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="VD: Bài nộp sớm sẽ được cộng điểm tinh thần học tập!"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Học sinh không cần tài khoản, chỉ quét QR và nhập Tên + Lớp
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{initialTask ? 'Lưu thay đổi' : 'TẠO NHIỆM VỤ & LẤY QR'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
