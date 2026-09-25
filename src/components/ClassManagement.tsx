import React, { useState } from 'react';
import { Classroom, Student, Task, Submission, Game, GameResult } from '../types';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Inbox, 
  Gamepad2, 
  ArrowRight, 
  Check, 
  X,
  FileSpreadsheet,
  Download,
  UserPlus,
  Lock
} from 'lucide-react';
import { storage } from '../services/storage';

interface ClassManagementProps {
  classes: Classroom[];
  students: Student[];
  tasks: Task[];
  submissions: Submission[];
  games: Game[];
  gameResults: GameResult[];
  onNavigate: (tab: string, param?: string) => void;
  onRefresh: () => void;
  onOpenStudentRoster: (classId?: string) => void;
  isOwner?: boolean;
  onRequestLogin?: () => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  students,
  tasks,
  submissions,
  games,
  gameResults,
  onNavigate,
  onRefresh,
  onOpenStudentRoster,
  isOwner = false,
  onRequestLogin,
}) => {
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState<'10' | '11' | '12'>('10');
  const [formCount, setFormCount] = useState(40);
  const [formSubject, setFormSubject] = useState('Tin học');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState<'emerald' | 'blue' | 'indigo' | 'violet' | 'rose' | 'amber'>('emerald');

  const handleOpenCreate = () => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    setIsCreating(true);
    setEditingClass(null);
    setFormName('');
    setFormGrade('10');
    setFormCount(40);
    setFormSubject('Tin học 10');
    setFormDesc('');
    setFormColor('emerald');
  };

  const handleOpenEdit = (cls: Classroom) => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    setEditingClass(cls);
    setIsCreating(false);
    setFormName(cls.name);
    setFormGrade(cls.grade as any);
    setFormCount(cls.studentCount);
    setFormSubject(cls.subject);
    setFormDesc(cls.description);
    setFormColor(cls.colorTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (!formName.trim()) return;

    const classId = editingClass ? editingClass.id : formName.trim().toUpperCase().replace(/\s+/g, '');
    const updatedClass: Classroom = {
      id: classId,
      name: formName.trim(),
      grade: formGrade,
      studentCount: Number(formCount) || 0,
      subject: formSubject.trim(),
      description: formDesc.trim(),
      colorTheme: formColor,
      createdAt: editingClass ? editingClass.createdAt : new Date().toISOString(),
    };

    storage.saveClass(updatedClass);
    onRefresh();
    setIsCreating(false);
    setEditingClass(null);
  };

  const handleDelete = (cls: Classroom) => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa lớp ${cls.name}? Các nhiệm vụ và bài nộp vẫn được giữ.`)) {
      storage.deleteClass(cls.id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase">
            <Users className="w-4 h-4" />
            <span>Quản trị danh sách lớp & học sinh</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            Quản Lý Lớp Học THPT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các lớp mặc định: 10A, 10B, 11A, 11B, 12A, 12B. Giáo viên có thể thêm, chỉnh sửa hoặc quản lý học sinh và hoạt động từng lớp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút 1: Nhập học sinh từ Excel */}
          <button
            onClick={() => onOpenStudentRoster('ALL')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Nhập danh sách học sinh từ file Excel hoặc CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập học sinh từ Excel</span>
          </button>

          {/* Nút 2: Xuất học sinh */}
          <button
            onClick={() => onOpenStudentRoster('ALL')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Xuất danh sách học sinh ra file Excel"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Xuất học sinh</span>
          </button>

          {/* Nút 3: Thêm học sinh */}
          <button
            onClick={() => onOpenStudentRoster('ALL')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Thêm học sinh mới vào lớp"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>

          {/* Nút 4: Xóa học sinh */}
          <button
            onClick={() => onOpenStudentRoster('ALL')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Quản lý & xóa học sinh trong danh sách"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>Xóa học sinh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Lớp Mới</span>
          </button>
        </div>
      </div>

      {/* Modal / Form for Create / Edit */}
      {(isCreating || editingClass) && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-md transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold font-display text-base text-slate-900">
              {isCreating ? 'Tạo lớp học mới' : `Chỉnh sửa thông tin ${editingClass?.name}`}
            </h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingClass(null);
              }}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tên lớp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: 10A, 11C, 12 Chuyên Hóa..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sĩ số học sinh
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formCount}
                onChange={(e) => setFormCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Môn học giảng dạy
              </label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="VD: Tin học 10, Lập trình Python..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Màu sắc nhận diện thẻ lớp
              </label>
              <select
                value={formColor}
                onChange={(e) => setFormColor(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              >
                <option value="emerald">Xanh lục (Emerald)</option>
                <option value="blue">Xanh dương (Blue)</option>
                <option value="indigo">Xanh chàm (Indigo)</option>
                <option value="violet">Tím (Violet)</option>
                <option value="rose">Hồng đào (Rose)</option>
                <option value="amber">Vàng cam (Amber)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mô tả lớp học / Ghi chú năm học
              </label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="VD: Lớp chọn tự nhiên khối 10, phòng học 204..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingClass(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isCreating ? 'Hoàn tất thêm lớp' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const classTasks = tasks.filter(t => t.classIds.includes(cls.id) || t.classIds.includes(cls.name));
          const classSubs = submissions.filter(s => s.studentClass === cls.id || s.studentClass.includes(cls.id));
          const classGames = games.filter(g => g.classIds.includes(cls.id) || g.classIds.includes(cls.name));

          const colorThemeClasses: Record<string, { border: string; badge: string; ring: string }> = {
            emerald: { border: 'border-emerald-200 hover:border-emerald-300', badge: 'bg-emerald-600', ring: 'ring-emerald-500/20' },
            blue: { border: 'border-blue-200 hover:border-blue-300', badge: 'bg-blue-600', ring: 'ring-blue-500/20' },
            indigo: { border: 'border-indigo-200 hover:border-indigo-300', badge: 'bg-indigo-600', ring: 'ring-indigo-500/20' },
            violet: { border: 'border-violet-200 hover:border-violet-300', badge: 'bg-violet-600', ring: 'ring-violet-500/20' },
            rose: { border: 'border-rose-200 hover:border-rose-300', badge: 'bg-rose-600', ring: 'ring-rose-500/20' },
            amber: { border: 'border-amber-200 hover:border-amber-300', badge: 'bg-amber-600', ring: 'ring-amber-500/20' },
          };
          const theme = colorThemeClasses[cls.colorTheme] || colorThemeClasses.emerald;

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-2xl border ${theme.border} p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-white font-display font-extrabold text-base shadow-xs ${theme.badge}`}>
                      {cls.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {cls.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {cls.subject} · {cls.studentCount} học sinh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Sửa thông tin lớp"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa lớp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 min-h-[32px]">
                  {cls.description || 'Chưa có ghi chú cho lớp học này.'}
                </p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px]">
                      <BookOpen className="w-3 h-3" />
                      <span>Nhiệm vụ</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 tabular-nums mt-0.5">
                      {classTasks.length}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px]">
                      <Inbox className="w-3 h-3" />
                      <span>Bài nộp</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 tabular-nums mt-0.5">
                      {classSubs.length}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px]">
                      <Gamepad2 className="w-3 h-3" />
                      <span>Trò chơi</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 tabular-nums mt-0.5">
                      {classGames.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => onOpenStudentRoster(cls.id)}
                  className="flex-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Xem và quản lý học sinh lớp này"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Học sinh ({students.filter(s => s.classId === cls.id).length})</span>
                </button>
                <button
                  onClick={() => onNavigate('tasks', cls.id)}
                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Nhiệm vụ</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onNavigate('submissions', cls.id)}
                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Kho bài ({classSubs.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
