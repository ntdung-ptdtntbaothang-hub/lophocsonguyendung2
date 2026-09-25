import React, { useState, useRef } from 'react';
import { Classroom, Student, Submission, GameResult } from '../types';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Search, 
  X, 
  Check, 
  AlertCircle, 
  Upload, 
  FileDown, 
  Phone, 
  Calendar, 
  CheckSquare, 
  Square,
  Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { storage } from '../services/storage';

interface StudentRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  selectedClassId?: string;
  students: Student[];
  submissions: Submission[];
  gameResults: GameResult[];
  onRefresh: () => void;
}

export const StudentRosterModal: React.FC<StudentRosterModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  students,
  submissions,
  gameResults,
  onRefresh,
}) => {
  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || '10A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // Modals inside roster
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

  if (!isOpen) return null;

  // Sync class selection if changed externally
  const activeClass = classes.find(c => c.id === currentClassId);

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

  // 1. Thêm học sinh (Add / Edit single student)
  const handleOpenAddModal = (studentToEdit?: Student) => {
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

  // 2. Xóa học sinh (Delete student)
  const handleDeleteSingleStudent = (student: Student) => {
    if (window.confirm(`Cô có chắc muốn xóa học sinh "${student.name}" khỏi lớp ${student.classId}?`)) {
      storage.deleteStudent(student.id);
      setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
      onRefresh();
    }
  };

  const handleDeleteSelectedStudents = () => {
    if (selectedStudentIds.length === 0) return;
    if (window.confirm(`Cô có chắc muốn xóa ${selectedStudentIds.length} học sinh đã chọn?`)) {
      storage.deleteStudents(selectedStudentIds);
      setSelectedStudentIds([]);
      onRefresh();
    }
  };

  // 3. Xuất học sinh (Export students to Excel)
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
        'Mã Học Sinh': s.studentCode || '',
        'Họ và Tên': s.name,
        'Lớp': s.classId,
        'Giới Tính': s.gender || '',
        'Ngày Sinh': s.birthDate || '',
        'SĐT Phụ Huynh': s.phoneNumber || '',
        'Số Bài Đã Nộp': studentSubs.length,
        'Điểm TB Trò Chơi': avgGameScore,
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
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 30 },
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `Danh_Sach_Hoc_Sinh_${currentClassId === 'ALL' ? 'Tat_Ca' : currentClassId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // 4. Nhập học sinh từ Excel (Import students from Excel/CSV)
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

        // Map column headers flexibly (supports variations: "Họ và Tên", "Họ tên", "Tên", "Mã học sinh", "Lớp", etc.)
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
          setImportError('Không tìm thấy cột "Họ và Tên" trong tệp Excel. Vui lòng kiểm tra lại cấu trúc file mẫu.');
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase">
                <span>Quản Lý Học Sinh THPT</span>
                <span>·</span>
                <span>{filteredStudents.length} học sinh</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-0.5">
                Danh Sách Học Sinh Lớp Học Số
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar with the 4 REQUESTED BUTTONS */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Class selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-semibold text-slate-400 mr-1">Lớp:</span>
            <button
              onClick={() => setCurrentClassId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                currentClassId === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả 6 lớp
            </button>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setCurrentClassId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  currentClassId === c.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.id} ({students.filter(s => s.classId === c.id).length} HS)
              </button>
            ))}
          </div>

          {/* THE 4 PRIMARY REQUESTED BUTTONS */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Button 1: Nhập học sinh từ Excel */}
            <button
              onClick={() => {
                setImportError(null);
                setImportPreviewData([]);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Nhập danh sách học sinh từ file Excel hoặc CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Nhập học sinh từ Excel</span>
            </button>

            {/* Button 2: Xuất học sinh */}
            <button
              onClick={handleExportExcel}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Xuất danh sách học sinh ra file Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Xuất học sinh</span>
            </button>

            {/* Button 3: Thêm học sinh */}
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
              title="Thêm học sinh mới vào lớp"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm học sinh</span>
            </button>

            {/* Button 4: Xóa học sinh (hiển thị khi chọn nhiều hoặc nút xóa nhanh) */}
            {selectedStudentIds.length > 0 && (
              <button
                onClick={handleDeleteSelectedStudents}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer animate-fade-in"
                title="Xóa các học sinh đã đánh dấu"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa học sinh ({selectedStudentIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Statistics Filter Bar */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh, mã HS..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            />
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px] self-end sm:self-center">
            <span>
              Tổng số: <strong className="text-slate-900 font-bold">{filteredStudents.length}</strong> học sinh
            </span>
            <span>
              Nam: <strong className="text-blue-700 font-bold">{filteredStudents.filter(s => s.gender === 'Nam').length}</strong>
            </span>
            <span>
              Nữ: <strong className="text-rose-700 font-bold">{filteredStudents.filter(s => s.gender === 'Nữ').length}</strong>
            </span>
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-sm">Chưa có học sinh nào trong danh sách</p>
              <p className="mt-1">Cô có thể bấm <strong>"Nhập học sinh từ Excel"</strong> để nhập cả lớp nhanh chóng hoặc bấm <strong>"Thêm học sinh"</strong> để nhập từng em.</p>
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
                  Thêm học sinh thủ công
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
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
                    <th className="py-3 px-3 w-28">Mã HS</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-3 text-center w-20">Lớp</th>
                    <th className="py-3 px-3 text-center w-20">Giới tính</th>
                    <th className="py-3 px-3 w-28">Ngày sinh</th>
                    <th className="py-3 px-3 w-28">SĐT Phụ huynh</th>
                    <th className="py-3 px-3 text-center w-24">Bài đã nộp</th>
                    <th className="py-3 px-3 text-center w-24">Điểm Game</th>
                    <th className="py-3 px-4">Ghi chú</th>
                    <th className="py-3 px-3 text-center w-24">Thao tác</th>
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
                    const avgScore = stuResults.length > 0 
                      ? Math.round((stuResults.reduce((acc, r) => acc + r.score, 0) / stuResults.length) * 10) / 10 
                      : null;

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
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {stu.name}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            {stu.classId}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            stu.gender === 'Nữ' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {stu.gender || 'Nam'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                          {stu.birthDate || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] font-mono whitespace-nowrap">
                          {stu.phoneNumber || '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700 tabular-nums">
                          {stuSubs.length} bài
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-700 tabular-nums">
                          {avgScore !== null ? `${avgScore}đ` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={stu.note}>
                          {stu.note || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenAddModal(stu)}
                              className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin"
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

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hệ thống tự động cập nhật sĩ số lớp học khi thêm/xóa học sinh.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* --- SUB-MODAL 1: THÊM / SỬA HỌC SINH --- */}
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
                <label className="block font-bold text-slate-700 mb-1">Ghi chú (chức vụ / đặc điểm)</label>
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

      {/* --- SUB-MODAL 2: NHẬP HỌC SINH TỪ EXCEL --- */}
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
                    Hỗ trợ file .xlsx, .xls hoặc .csv (từ SMAS, VnEdu hoặc mẫu Excel)
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

    </div>
  );
};
