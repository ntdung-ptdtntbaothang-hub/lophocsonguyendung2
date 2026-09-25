import React, { useState } from 'react';
import { Classroom, Game, GameQuestion, QuestionType } from '../types';
import { X, Plus, Trash2, Check, Gamepad2, Sparkles, HelpCircle } from 'lucide-react';
import { storage } from '../services/storage';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  onGameCreated: (newGame: Game) => void;
  initialGame?: Game | null;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  isOpen,
  onClose,
  classes,
  onGameCreated,
  initialGame,
}) => {
  const [title, setTitle] = useState(initialGame?.title || '');
  const [subject, setSubject] = useState(initialGame?.subject || 'Tin học');
  const [grade, setGrade] = useState(initialGame?.grade || 'Khối 10');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialGame?.classIds || ['10A', '10B']);
  const [description, setDescription] = useState(initialGame?.description || '');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(initialGame?.timeLimitSeconds || 300);

  // Questions builder state
  const [questions, setQuestions] = useState<GameQuestion[]>(
    initialGame?.questions || [
      {
        id: 'q-1',
        type: 'multiple_choice',
        prompt: 'Bào quan nào là trung tâm điều khiển mọi hoạt động sống của tế bào?',
        points: 20,
        options: ['Nhân tế bào', 'Ti thể', 'Ribosome', 'Lưới nội chất'],
        correctAnswer: 'Nhân tế bào',
        explanation: 'Nhân chứa NST mang ADN quy định các đặc điểm di truyền và hoạt động của tế bào.',
      },
      {
        id: 'q-2',
        type: 'true_false',
        prompt: 'Tế bào thực vật có không bào trung tâm lớn chứa dịch tế bào, tế bào động vật thì không có hoặc rất nhỏ.',
        points: 20,
        correctBool: true,
        explanation: 'Đúng. Không bào trung tâm lớn giúp tế bào thực vật duy trì sức trương nước.',
      },
    ]
  );

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

  const handleAddQuestion = (type: QuestionType) => {
    const newQ: GameQuestion = {
      id: `q-${Date.now()}`,
      type,
      prompt: '',
      points: 20,
      explanation: '',
    };

    if (type === 'multiple_choice') {
      newQ.options = ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];
      newQ.correctAnswer = 'Lựa chọn A';
    } else if (type === 'true_false') {
      newQ.correctBool = true;
    } else if (type === 'short_answer') {
      newQ.acceptedAnswers = ['Đáp án đúng'];
    } else if (type === 'matching') {
      newQ.pairs = [
        { id: 'p1', left: 'Khái niệm A', right: 'Đặc điểm tương ứng A' },
        { id: 'p2', left: 'Khái niệm B', right: 'Đặc điểm tương ứng B' },
      ];
    } else if (type === 'ordering') {
      newQ.orderedItems = ['Bước 1', 'Bước 2', 'Bước 3'];
    }

    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleUpdateQuestion = (index: number, updated: Partial<GameQuestion>) => {
    const list = [...questions];
    list[index] = { ...list[index], ...updated };
    setQuestions(list);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) return;

    const game: Game = {
      id: initialGame?.id || `game-${Date.now()}`,
      title: title.trim(),
      subject: subject.trim(),
      grade,
      classIds: selectedClasses,
      description: description.trim(),
      timeLimitSeconds: Number(timeLimitSeconds) || 0,
      questions,
      createdAt: initialGame?.createdAt || new Date().toISOString(),
      status: 'active',
      playCount: initialGame?.playCount || 0,
    };

    storage.saveGame(game);
    onGameCreated(game);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
              <Gamepad2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                {initialGame ? 'Chỉnh Sửa Trò Chơi Củng Cố' : '+ Thiết Kế Trò Chơi Củng Cố Kiến Thức'}
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Chấm điểm tự động, xếp hạng thời gian thực và vinh danh TOP 5
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Basic Game Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên trò chơi / Thử thách <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đấu trí Tin học: Thử thách Kiến thức Máy tính & Python"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
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
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
              >
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
                <option value="Toàn trường">Toàn trường</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời gian làm bài
              </label>
              <select
                value={timeLimitSeconds}
                onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
              >
                <option value={120}>2 phút (Nhanh)</option>
                <option value={300}>5 phút (Tiêu chuẩn)</option>
                <option value={600}>10 phút</option>
                <option value={0}>Không giới hạn thời gian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lớp tham gia
              </label>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleClass(c.id)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      selectedClasses.includes(c.id)
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả ngắn hoặc lời khích lệ học sinh
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Cả lớp quét mã QR tham gia thử thách 5 phút cuối tiết để ghi danh bảng vàng TOP 5!"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
            />
          </div>

          {/* Questions Section */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-display">
                  Danh Sách Câu Hỏi ({questions.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Hỗ trợ trắc nghiệm, đúng/sai, điền ngắn, ghép đôi và sắp xếp thứ tự
                </p>
              </div>

              {/* Add Question Types Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Thêm câu hỏi:</span>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple_choice')}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Trắc nghiệm (A/B/C/D)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('true_false')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Đúng/Sai
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('short_answer')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Trả lời ngắn
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('matching')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Ghép đôi
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('ordering')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Sắp xếp
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                        {qIndex + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800 uppercase">
                        {q.type === 'multiple_choice' && 'Trắc nghiệm 4 lựa chọn'}
                        {q.type === 'true_false' && 'Đúng / Sai'}
                        {q.type === 'short_answer' && 'Điền câu trả lời ngắn'}
                        {q.type === 'matching' && 'Ghép đôi khái niệm'}
                        {q.type === 'ordering' && 'Sắp xếp theo thứ tự'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400">Điểm:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={q.points}
                          onChange={(e) => handleUpdateQuestion(qIndex, { points: Number(e.target.value) })}
                          className="w-14 px-2 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        disabled={questions.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nội dung câu hỏi:
                    </label>
                    <input
                      type="text"
                      required
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(qIndex, { prompt: e.target.value })}
                      placeholder="Nhập nội dung câu hỏi..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-hidden focus:border-purple-500 font-medium"
                    />
                  </div>

                  {/* Question Type Specific Editor */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Các lựa chọn (Tích chọn đáp án đúng):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswer === opt}
                              onChange={() => handleUpdateQuestion(qIndex, { correctAnswer: opt })}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(q.options || [])];
                                newOpts[optIndex] = e.target.value;
                                const isCurCorrect = q.correctAnswer === opt;
                                handleUpdateQuestion(qIndex, {
                                  options: newOpts,
                                  correctAnswer: isCurCorrect ? e.target.value : q.correctAnswer,
                                });
                              }}
                              className="w-full text-xs outline-hidden"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Đáp án chuẩn:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-emerald-700">
                        <input
                          type="radio"
                          name={`tf-${q.id}`}
                          checked={q.correctBool === true}
                          onChange={() => handleUpdateQuestion(qIndex, { correctBool: true })}
                        />
                        <span>ĐÚNG (True)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-rose-700">
                        <input
                          type="radio"
                          name={`tf-${q.id}`}
                          checked={q.correctBool === false}
                          onChange={() => handleUpdateQuestion(qIndex, { correctBool: false })}
                        />
                        <span>SAI (False)</span>
                      </label>
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Từ khóa đáp án chấp nhận (cách nhau bởi dấu phẩy):
                      </label>
                      <input
                        type="text"
                        value={q.acceptedAnswers?.join(', ') || ''}
                        onChange={(e) => {
                          const answers = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          handleUpdateQuestion(qIndex, { acceptedAnswers: answers });
                        }}
                        placeholder="VD: ATP, atp"
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  )}

                  {q.type === 'matching' && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-700 text-[11px]">Các cặp ghép nối đúng:</div>
                      {q.pairs?.map((pair, pIdx) => (
                        <div key={pair.id} className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => {
                              const newPairs = [...(q.pairs || [])];
                              newPairs[pIdx].left = e.target.value;
                              handleUpdateQuestion(qIndex, { pairs: newPairs });
                            }}
                            placeholder="Cột trái (Khái niệm)"
                            className="px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => {
                              const newPairs = [...(q.pairs || [])];
                              newPairs[pIdx].right = e.target.value;
                              handleUpdateQuestion(qIndex, { pairs: newPairs });
                            }}
                            placeholder="Cột phải (Nội dung khớp)"
                            className="px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'ordering' && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-700 text-[11px]">
                        Nhập các bước theo THỨ TỰ ĐÚNG (hệ thống sẽ tự đảo lộn ngẫu nhiên khi học sinh chơi):
                      </div>
                      {q.orderedItems?.map((item, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-5 text-center text-slate-400 font-mono">{oIdx + 1}.</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...(q.orderedItems || [])];
                              newItems[oIdx] = e.target.value;
                              handleUpdateQuestion(qIndex, { orderedItems: newItems });
                            }}
                            placeholder={`Bước ${oIdx + 1}`}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation for students */}
                  <div>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIndex, { explanation: e.target.value })}
                      placeholder="Giải thích sau khi học sinh trả lời (tùy chọn)..."
                      className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-md bg-white text-slate-600 outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Tổng điểm tối đa: {questions.reduce((sum, q) => sum + (q.points || 0), 0)} điểm
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
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{initialGame ? 'Lưu Trò Chơi' : 'TẠO TRÒ CHƠI & LẤY QR'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
