import React, { useState, useRef } from 'react';
import { Classroom, Student, Submission, GameResult } from '../types';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Search, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  FileDown, 
  CheckSquare, 
  Square,
  Edit2,
  School,
  GraduationCap,
  Trophy,
  Star,
  Award,
  Sparkles,
  Smartphone,
  Eye,
  Lock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { storage } from '../services/storage';
import { StudentAccountModal } from './StudentAccountModal';

interface StudentManagementViewProps {
  classes: Classroom[];
  students: Student[];
  submissions: Submission[];
  gameResults: GameResult[];
  initialClassId?: string;
  onRefresh: () => void;
  onOpenStudentPortal?: (studentId?: string, classId?: string) => void;
  isOwner?: boolean;
  onRequestLogin?: () => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  classes,
  students,
  submissions,
  gameResults,
  initialClassId,
  onRefresh,
  onOpenStudentPortal,
  isOwner = false,
  onRequestLogin,
}) => {
  const [currentClassId, setCurrentClassId] = useState<string>(initialClassId || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [viewingStudentAccount, setViewingStudentAccount] = useState<Student | null>(null);
  
  // Sub-modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<Partial<Student>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single student form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formClass, setFormClass] = useState(currentClassId === 'ALL' ? '10A' : currentClassId);
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ' | string>('Nam');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNote, setFormNote] = useState('');

  // Filter students
  const filteredStudents = students.filter(s => {
    if (currentClassId !== 'ALL' && s.classId !== currentClassId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
        (s.note && s.note.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(i => i !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // 1. Thêm học sinh
  const handleOpenAddModal = (studentToEdit?: Student) => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (studentToEdit) {
      setEditingStudent(studentToEdit);
      setFormName(studentToEdit.name);
      setFormCode(studentToEdit.studentCode || '');
      setFormClass(studentToEdit.classId);
      setFormGender(studentToEdit.gender || 'Nam');
      setFormBirthDate(studentToEdit.birthDate || '');
      setFormPhone(studentToEdit.phoneNumber || '');
      setFormNote(studentToEdit.note || '');
    } else {
      setEditingStudent(null);
      setFormName('');
      const targetCid = currentClassId === 'ALL' ? '10A' : currentClassId;
      const classStudents = students.filter(s => s.classId === targetCid);
      const nextNum = (classStudents.length + 1).toString().padStart(2, '0');
      setFormCode(`HS${targetCid}${nextNum}`);
      setFormClass(targetCid);
      setFormGender('Nam');
      setFormBirthDate('');
      setFormPhone('');
      setFormNote('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveStudentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (!formName.trim() || !formClass) return;

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `stu-${Date.now()}`,
      name: formName.trim(),
      studentCode: formCode.trim() || `HS${formClass}${Math.floor(Math.random() * 900 + 100)}`,
      classId: formClass,
      gender: formGender,
      birthDate: formBirthDate,
      phoneNumber: formPhone.trim(),
      note: formNote.trim(),
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
    };

    storage.saveStudent(studentData);
    setIsAddModalOpen(false);
    setEditingStudent(null);
    onRefresh();
  };

  // 2. Xóa học sinh
  const handleDeleteSingleStudent = (student: Student) => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (window.confirm(`Cô có chắc muốn xóa học sinh "${student.name}" khỏi lớp ${student.classId}?`)) {
      storage.deleteStudent(student.id);
      setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
      onRefresh();
    }
  };

  const handleDeleteSelectedStudents = () => {
    if (!isOwner) {
      if (onRequestLogin) onRequestLogin();
      return;
    }
    if (selectedStudentIds.length === 0) return;
    if (window.confirm(`Cô có chắc chắn muốn xóa ${selectedStudentIds.length} học sinh đã chọn khỏi danh sách?`)) {
      storage.deleteStudents(selectedStudentIds);
      setSelectedStudentIds([]);
      onRefresh();
    }
  };

  // 3. Xuất học sinh
  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map((s, idx) => {
      const studentSubs = submissions.filter(sub => 
        sub.studentName.trim().toLowerCase() === s.name.trim().toLowerCase() &&
        (sub.studentClass === s.classId || sub.studentClass.includes(s.classId))
      );
      const studentResults = gameResults.filter(r => 
        r.studentName.trim().toLowerCase() === s.name.trim().toLowerCase() &&
        (r.studentClass === s.classId || r.studentClass.includes(s.classId))
      );
      const avgGameScore = studentResults.length > 0 
        ? Math.round((studentResults.reduce((acc, r) => acc + r.score, 0) / studentResults.length) * 10) / 10 
        : '';

      return {
        'STT': idx + 1,
        'Mã Tài Khoản': s.studentCode || '',
        'Họ và Tên': s.name,
        'Lớp': s.classId,
        'Tổng Điểm': s.totalScore || 0,
        'Hạng Lớp': s.rankInClass || 1,
        'Điểm Bài Nộp': s.submissionScore || 0,
        'Điểm Trò Chơi': s.gameScore || 0,
        'Điểm Thưởng': s.bonusScore || 0,
        'Số Bài Đã Nộp': studentSubs.length,
        'Số Lượt Chơi Game': studentResults.length,
        'Điểm TB Trò Chơi': avgGameScore,
        'Giới Tính': s.gender || '',
        'Ngày Sinh': s.birthDate || '',
        'SĐT Phụ Huynh': s.phoneNumber || '',
        'Ghi Chú': s.note || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Học sinh ${currentClassId}`);
    
    // Auto column widths
    const colWidths = [
      { wch: 6 },
      { wch: 14 },
      { wch: 26 },
      { wch: 10 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 },
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `Danh_Sach_Hoc_Sinh_${currentClassId === 'ALL' ? 'Tat_Ca' : currentClassId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // 4. Nhập học sinh từ Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'STT': 1,
        'Mã Học Sinh': 'HS10A01',
        'Họ và Tên': 'Nguyễn Văn A',
        'Lớp': currentClassId === 'ALL' ? '10A' : currentClassId,
        'Giới Tính': 'Nam',
        'Ngày Sinh': '2010-03-15',
        'SĐT Phụ Huynh': '0912345678',
        'Ghi Chú': 'Lớp trưởng',
      },
      {
        'STT': 2,
        'Mã Học Sinh': 'HS10A02',
        'Họ và Tên': 'Trần Thị B',
        'Lớp': currentClassId === 'ALL' ? '10A' : currentClassId,
        'Giới Tính': 'Nữ',
        'Ngày Sinh': '2010-07-22',
        'SĐT Phụ Huynh': '0987654321',
        'Ghi Chú': 'Lớp phó học tập',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Nhap_Hoc_Sinh');
    XLSX.writeFile(workbook, 'Mau_Danh_Sach_Hoc_Sinh_THPT.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setImportError('Tệp Excel trống hoặc không có dòng dữ liệu hợp lệ.');
          return;
        }

        const parsedList: Partial<Student>[] = rawJson.map((row, index) => {
          const keys = Object.keys(row);
          const findVal = (possibleNames: string[]) => {
            const key = keys.find(k => possibleNames.some(p => k.toLowerCase().trim().includes(p.toLowerCase())));
            return key ? row[key] : '';
          };

          const name = findVal(['Họ và Tên', 'Họ tên', 'Tên học sinh', 'Tên']) || '';
          const code = findVal(['Mã Học Sinh', 'Mã HS', 'Mã', 'Số báo danh']) || `HS${index + 1}`;
          const cls = findVal(['Lớp', 'Tên Lớp']) || (currentClassId === 'ALL' ? '10A' : currentClassId);
          const gender = findVal(['Giới Tính', 'Phái']) || 'Nam';
          const birthDate = findVal(['Ngày Sinh', 'Năm sinh']) || '';
          const phone = findVal(['SĐT', 'Điện thoại', 'Điện thoại phụ huynh', 'Liên hệ']) || '';
          const note = findVal(['Ghi Chú', 'Ghi chu']) || '';

          return {
            id: `stu-${Date.now()}-${index}`,
            studentCode: String(code).trim(),
            name: String(name).trim(),
            classId: String(cls).trim().toUpperCase(),
            gender: String(gender).trim(),
            birthDate: String(birthDate).trim(),
            phoneNumber: String(phone).trim(),
            note: String(note).trim(),
            createdAt: new Date().toISOString(),
          };
        }).filter(item => Boolean(item.name));

        if (parsedList.length === 0) {
          setImportError('Không tìm thấy cột "Họ và Tên" trong tệp Excel. Vui lòng kiểm tra lại file mẫu.');
          return;
        }

        setImportPreviewData(parsedList);
      } catch (err: any) {
        setImportError(`Lỗi đọc file: ${err.message || 'Định dạng file không được hỗ trợ'}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (importPreviewData.length === 0) return;

    const validatedStudents: Student[] = importPreviewData.map((p, idx) => ({
      id: p.id || `stu-imp-${Date.now()}-${idx}`,
      studentCode: p.studentCode || `HS${p.classId}${idx + 1}`,
      name: p.name || 'Học sinh',
      classId: p.classId || (currentClassId === 'ALL' ? '10A' : currentClassId),
      gender: p.gender || 'Nam',
      birthDate: p.birthDate || '',
      phoneNumber: p.phoneNumber || '',
      note: p.note || '',
      createdAt: new Date().toISOString(),
    }));

    storage.saveStudents(validatedStudents);
    setIsImportModalOpen(false);
    setImportPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase">
            <GraduationCap className="w-4 h-4" />
            <span>Sổ Danh Bộ & Học Sinh THPT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            Quản Lý Danh Sách Học Sinh (6 Lớp: 10A – 12B)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dễ dàng nhập danh sách cả lớp từ Excel, xuất danh sách điểm danh, thêm hoặc xóa học sinh nhanh chóng.
          </p>
        </div>

        {/* 4 PRIMARY BUTTONS IN TOP BANNER */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* 1. Nhập học sinh từ Excel */}
          <button
            onClick={() => {
              if (!isOwner) {
                if (onRequestLogin) onRequestLogin();
                return;
              }
              setImportError(null);
              setImportPreviewData([]);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={isOwner ? "Nhập danh sách học sinh từ file Excel hoặc CSV" : "Đăng nhập chủ tài khoản để nhập Excel"}
          >
            {isOwner ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
            <span>Nhập học sinh từ Excel</span>
          </button>

          {/* 2. Xuất học sinh */}
          <button
            onClick={handleExportExcel}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Xuất danh sách học sinh ra file Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Xuất học sinh</span>
          </button>

          {/* 3. Thêm học sinh */}
          <button
            onClick={() => handleOpenAddModal()}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg ${
              isOwner ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'
            }`}
            title={isOwner ? "Thêm học sinh mới vào lớp" : "Đăng nhập chủ tài khoản để thêm học sinh"}
          >
            {isOwner ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-300" />}
            <span>Thêm học sinh</span>
          </button>

          {/* 4. Xem Giao Diện Học Sinh */}
          {onOpenStudentPortal && (
            <button
              onClick={() => onOpenStudentPortal(undefined, currentClassId === 'ALL' ? '10A' : currentClassId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Xem giao diện tra cứu điểm và sổ điểm của học sinh"
            >
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span>Xem Tài Khoản Học Sinh</span>
            </button>
          )}

          {/* 5. Xóa học sinh (nút xóa nhiều khi chọn hoặc mở danh sách chọn) */}
          {selectedStudentIds.length > 0 ? (
            <button
              onClick={handleDeleteSelectedStudents}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer animate-fade-in"
              title="Xóa các học sinh đã đánh dấu"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa học sinh ({selectedStudentIds.length})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (filteredStudents.length === 0) return;
                alert('Cô vui lòng tích chọn vào ô vuông đầu dòng của học sinh cần xóa, sau đó bấm nút "Xóa học sinh".');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Hướng dẫn xóa học sinh"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
              <span>Xóa học sinh</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Selector Tabs & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-semibold text-slate-400 mr-1">Chọn lớp:</span>
            <button
              onClick={() => setCurrentClassId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                currentClassId === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả các lớp ({students.length} HS)
            </button>
            {classes.map(c => {
              const count = students.filter(s => s.classId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCurrentClassId(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    currentClassId === c.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Lớp {c.id} ({count} HS)
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh, mã HS..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị: <strong className="text-slate-900 font-bold">{filteredStudents.length}</strong> học sinh
            {currentClassId !== 'ALL' && <span> thuộc Lớp <strong>{currentClassId}</strong></span>}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Nam: <strong className="text-blue-700">{filteredStudents.filter(s => s.gender === 'Nam').length}</strong></span>
            <span>Nữ: <strong className="text-rose-700">{filteredStudents.filter(s => s.gender === 'Nữ').length}</strong></span>
            {selectedStudentIds.length > 0 && (
              <span className="text-emerald-700 font-bold">Đã chọn: {selectedStudentIds.length} em</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">Chưa có học sinh nào trong danh sách</p>
            <p className="mt-1">Cô có thể bấm "Nhập học sinh từ Excel" để nhập danh sách từ file hoặc bấm "Thêm học sinh" để nhập thủ công.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer"
              >
                Nhập học sinh từ Excel
              </button>
              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Thêm học sinh
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-500 hover:text-emerald-700 cursor-pointer"
                      title="Chọn tất cả"
                    >
                      {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3 w-28">Mã Tài Khoản</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-3 text-center w-20">Lớp</th>
                  <th className="py-3 px-3 text-center w-20">Hạng Lớp</th>
                  <th className="py-3 px-3 text-center w-28">Tổng Điểm</th>
                  <th className="py-3 px-3 text-center w-28">Điểm Bài Nộp</th>
                  <th className="py-3 px-3 text-center w-28">Điểm Trò Chơi</th>
                  <th className="py-3 px-3 text-center w-24">Huy hiệu</th>
                  <th className="py-3 px-3 w-28">SĐT Phụ huynh</th>
                  <th className="py-3 px-3 text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu, index) => {
                  const isSelected = selectedStudentIds.includes(stu.id);
                  const stuSubs = submissions.filter(s => 
                    s.studentName.trim().toLowerCase() === stu.name.trim().toLowerCase() &&
                    (s.studentClass === stu.classId || s.studentClass.includes(stu.classId))
                  );
                  const stuResults = gameResults.filter(r => 
                    r.studentName.trim().toLowerCase() === stu.name.trim().toLowerCase() &&
                    (r.studentClass === stu.classId || r.studentClass.includes(stu.classId))
                  );

                  return (
                    <tr 
                      key={stu.id} 
                      className={`transition-colors ${isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(stu.id)}
                          className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-600 text-[11px]">
                        {stu.studentCode || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setViewingStudentAccount(stu)}
                          className="text-left font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer group flex items-center gap-1.5"
                          title="Bấm để xem hồ sơ tài khoản và bảng điểm của học sinh"
                        >
                          <span>{stu.name}</span>
                          <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          {stu.classId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          stu.rankInClass === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : stu.rankInClass === 2
                            ? 'bg-slate-200 text-slate-800'
                            : stu.rankInClass === 3
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {stu.rankInClass === 1 ? '🥇 #1' :
                           stu.rankInClass === 2 ? '🥈 #2' :
                           stu.rankInClass === 3 ? '🥉 #3' :
                           `#${stu.rankInClass || index + 1}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{stu.totalScore || 0} đ</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-blue-700 text-xs">
                          +{stu.submissionScore || 0} đ
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {stuSubs.length} bài đã nộp
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-purple-700 text-xs">
                          +{stu.gameScore || 0} đ
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {stuResults.length} lần chơi
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {stu.badges && stu.badges.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            {stu.badges.length} huy hiệu
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] font-mono whitespace-nowrap">
                        {stu.phoneNumber || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingStudentAccount(stu)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="Xem hồ sơ tài khoản & sổ điểm"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenAddModal(stu)}
                            className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin học sinh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingleStudent(stu)}
                            className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* --- MODAL THÊM / SỬA HỌC SINH --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>{editingStudent ? 'Chỉnh Sửa Học Sinh' : 'Thêm Học Sinh Mới'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp học *</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: HS10A01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại phụ huynh</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú (chức vụ / năng khiếu)</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="VD: Lớp trưởng, học sinh giỏi môn Tin học"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  {editingStudent ? 'Cập Nhật' : 'Lưu Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NHẬP HỌC SINH TỪ EXCEL --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Nhập Danh Sách Học Sinh Từ Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ file .xlsx, .xls hoặc .csv (từ phần mềm quản lý trường học SMAS / VnEdu)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Step 1: Download Template */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-emerald-900">Tải File Mẫu Chuẩn Excel:</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    File mẫu gồm các cột: STT, Mã Học Sinh, Họ và Tên, Lớp, Giới Tính, Ngày Sinh, SĐT Phụ Huynh, Ghi Chú.
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Tải File Mẫu (.xlsx)</span>
                </button>
              </div>

              {/* Step 2: Upload File Box */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn File Excel từ máy tính của Cô:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer p-2 border border-slate-300 rounded-2xl bg-slate-50 cursor-pointer"
                />
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Step 3: Preview Parsed List */}
              {importPreviewData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Xem trước danh sách đọc được ({importPreviewData.length} học sinh):
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      ✓ Đọc dữ liệu thành công
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="py-2 px-2">STT</th>
                          <th className="py-2 px-2">Mã HS</th>
                          <th className="py-2 px-3">Họ và Tên</th>
                          <th className="py-2 px-2">Lớp</th>
                          <th className="py-2 px-2">Giới tính</th>
                          <th className="py-2 px-2">SĐT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewData.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2 text-slate-400">{i + 1}</td>
                            <td className="py-1.5 px-2 font-mono">{p.studentCode}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{p.name}</td>
                            <td className="py-1.5 px-2 font-bold text-emerald-700">{p.classId}</td>
                            <td className="py-1.5 px-2">{p.gender}</td>
                            <td className="py-1.5 px-2 font-mono">{p.phoneNumber || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={importPreviewData.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Nhập ({importPreviewData.length} Học Sinh)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL HỒ SƠ TÀI KHOẢN & SỔ ĐIỂM HỌC SINH --- */}
      <StudentAccountModal
        student={viewingStudentAccount}
        isOpen={!!viewingStudentAccount}
        onClose={() => setViewingStudentAccount(null)}
        submissions={submissions}
        gameResults={gameResults}
        onRefresh={onRefresh}
        isTeacherView={true}
        isOwner={isOwner}
        onRequestLogin={onRequestLogin}
      />
    </div>
  );
};
