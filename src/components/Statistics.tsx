import React from 'react';
import { Classroom, Task, Submission, Game, GameResult } from '../types';
import { BarChart3, TrendingUp, Users, CheckCircle2, Award, BookOpen, Clock, Download, Printer } from 'lucide-react';

interface StatisticsProps {
  classes: Classroom[];
  tasks: Task[];
  submissions: Submission[];
  games: Game[];
  gameResults: GameResult[];
}

export const Statistics: React.FC<StatisticsProps> = ({
  classes,
  tasks,
  submissions,
  games,
  gameResults,
}) => {
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalSubmissions = submissions.length;
  const reviewedSubmissions = submissions.filter(s => s.status === 'reviewed').length;
  const reviewedRate = totalSubmissions > 0 ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0;

  // Breakdown by class
  const classBreakdown = classes.map((cls) => {
    const classTasks = tasks.filter(t => t.classIds.includes(cls.id) || t.classIds.includes(cls.name));
    const classSubs = submissions.filter(s => s.studentClass === cls.id || s.studentClass.includes(cls.id));
    const classResults = gameResults.filter(r => r.studentClass === cls.id || r.studentClass.includes(cls.id));
    
    const avgGameScore = classResults.length > 0
      ? Math.round((classResults.reduce((acc, r) => acc + r.score, 0) / classResults.length) * 10) / 10
      : 0;

    const submissionRate = cls.studentCount > 0 && classTasks.length > 0
      ? Math.min(100, Math.round((classSubs.length / (cls.studentCount * classTasks.length)) * 100))
      : 0;

    return {
      class: cls,
      tasksCount: classTasks.length,
      submissionsCount: classSubs.length,
      gameResultsCount: classResults.length,
      avgGameScore,
      submissionRate,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Phân Tích & Báo Cáo Giáo Dục</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            Báo Cáo & Thống Kê Học Tập
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp mức độ chuyên cần nộp bài và hiệu quả tiếp thu kiến thức qua các trò chơi theo từng lớp THPT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Tổng học sinh 6 lớp</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-display text-slate-900 mt-2 tabular-nums">
            {totalStudents} HS
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Khối 10, 11, 12</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Tỷ lệ chấm bài</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-display text-blue-700 mt-2 tabular-nums">
            {reviewedRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{reviewedSubmissions}/{totalSubmissions} bài đã đánh giá</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Nhiệm vụ đã tạo</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-display text-purple-700 mt-2 tabular-nums">
            {tasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Kèm mã QR nộp bài</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Lượt tham gia trò chơi</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-display text-amber-600 mt-2 tabular-nums">
            {gameResults.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ghi nhận xếp hạng</div>
        </div>
      </div>

      {/* Class Comparison Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wide">
            Hiệu Suất Học Tập Theo Từng Lớp (10A – 12B)
          </div>
          <div className="text-slate-400 text-[11px]">Dữ liệu cập nhật thời gian thực</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-3 text-center">Sĩ số</th>
                <th className="py-3 px-3 text-center">Nhiệm vụ</th>
                <th className="py-3 px-3 text-center">Số bài đã nộp</th>
                <th className="py-3 px-4">Tiến độ nộp bài</th>
                <th className="py-3 px-3 text-center">Lượt chơi game</th>
                <th className="py-3 px-4 text-right">Điểm TB trò chơi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classBreakdown.map((row) => (
                <tr key={row.class.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center font-display">
                        {row.class.id}
                      </span>
                      <div>
                        <div className="font-bold">{row.class.name}</div>
                        <div className="text-[10px] text-slate-400">{row.class.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700 font-medium tabular-nums">
                    {row.class.studentCount}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700 tabular-nums">
                    {row.tasksCount}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-blue-700 tabular-nums">
                    {row.submissionsCount}
                  </td>
                  <td className="py-3.5 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(10, row.submissionsCount * 12))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                        {Math.min(100, row.submissionsCount * 12)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-purple-700 tabular-nums">
                    {row.gameResultsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-700 text-sm tabular-nums">
                    {row.avgGameScore > 0 ? `${row.avgGameScore}đ` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
