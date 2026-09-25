import React, { useState, useEffect } from 'react';
import { Classroom, Student, Task, Submission, Game, GameResult, NotificationItem } from './types';
import { storage } from './services/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ClassManagement } from './components/ClassManagement';
import { StudentManagementView } from './components/StudentManagementView';
import { StudentRosterModal } from './components/StudentRosterModal';
import { TaskManagement } from './components/TaskManagement';
import { SubmissionsRepository } from './components/SubmissionsRepository';
import { GameManagement } from './components/GameManagement';
import { GameResultsAndHonor } from './components/GameResultsAndHonor';
import { Statistics } from './components/Statistics';
import { NotificationsView } from './components/NotificationsView';
import { StudentTaskView } from './components/StudentTaskView';
import { StudentGameView } from './components/StudentGameView';
import { StudentPortalView } from './components/StudentPortalView';
import { QRCodeModal } from './components/QRCodeModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateGameModal } from './components/CreateGameModal';
import { SubmissionPreviewModal } from './components/SubmissionPreviewModal';
import { LoginModal } from './components/LoginModal';
import { authService } from './services/auth';
import { decodeTaskFromUrl } from './services/taskLink';

export default function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [targetClassFilter, setTargetClassFilter] = useState<string | undefined>(undefined);
  const [targetGameId, setTargetGameId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication state (Owner credentials: nguyendung1347 / Linh123@)
  const [isOwner, setIsOwner] = useState<boolean>(() => authService.isOwner());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPurposeMessage, setLoginPurposeMessage] = useState<string | undefined>(undefined);

  // Mode: teacher vs student preview vs student portal
  const [appMode, setAppMode] = useState<'teacher' | 'student_task' | 'student_game' | 'student_portal'>('teacher');
  const [activeStudentTaskId, setActiveStudentTaskId] = useState<string | undefined>(undefined);
  const [activeStudentGameId, setActiveStudentGameId] = useState<string | undefined>(undefined);
  const [portalStudentId, setPortalStudentId] = useState<string>('');
  const [portalClassId, setPortalClassId] = useState<string>('10A');

  // Data state
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals state
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    type: 'task' | 'game' | 'class';
    id: string;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    type: 'task',
    id: '',
    title: '',
  });

  const [studentRosterModal, setStudentRosterModal] = useState<{
    isOpen: boolean;
    classId: string;
  }>({
    isOpen: false,
    classId: 'ALL',
  });

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);

  // Load data function
  const reloadData = () => {
    setClasses(storage.getClasses());
    setStudents(storage.getStudents());
    setTasks(storage.getTasks());
    setSubmissions(storage.getSubmissions());
    setGames(storage.getGames());
    setGameResults(storage.getGameResults());
    setNotifications(storage.getNotifications());
  };

  // Initial load & URL params detection
  useEffect(() => {
    reloadData();

    // Subscribe to auth state
    const unsubAuth = authService.subscribe(() => {
      setIsOwner(authService.isOwner());
    });

    // Subscribe to shared storage updates (syncs in real-time across devices)
    const unsubStorage = storage.subscribe(() => {
      reloadData();
    });

    // Check query params for direct student access
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const taskId = params.get('taskId');
    const tdata = params.get('tdata');
    const gameId = params.get('gameId');
    const studentId = params.get('studentId');
    const classId = params.get('classId');

    if (mode === 'student' && taskId) {
      setAppMode('student_task');
      setActiveStudentTaskId(taskId);

      // 1. If link contains encoded task data (tdata), decode and adopt immediately (0ms delay)
      if (tdata) {
        const decoded = decodeTaskFromUrl(tdata);
        if (decoded && decoded.id === taskId) {
          storage.saveTask(decoded);
          reloadData();
        }
      }

      // 2. Eagerly fetch task from server to ensure it loads even on a brand new computer/device
      storage.fetchTaskById(taskId).then((t) => {
        if (t) {
          reloadData();
        }
      });
    } else if (mode === 'game' && gameId) {
      setAppMode('student_game');
      setActiveStudentGameId(gameId);
    } else if (mode === 'portal' || mode === 'student_portal') {
      setAppMode('student_portal');
      if (studentId) setPortalStudentId(studentId);
      if (classId) setPortalClassId(classId);
    }

    return () => {
      unsubAuth();
      unsubStorage();
    };
  }, []);

  const handleRequestLogin = (msg?: string) => {
    setLoginPurposeMessage(
      msg || 'Chỉ chủ tài khoản app mới có quyền thêm mới & chỉnh sửa!'
    );
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsOwner(false);
  };

  const handleShowQR = (type: 'task' | 'game' | 'class', id: string, title: string, subtitle?: string) => {
    setQrModal({
      isOpen: true,
      type,
      id,
      title,
      subtitle,
    });
  };

  const handleNavigate = (tab: string, param?: string) => {
    setCurrentTab(tab);
    if (tab === 'tasks' || tab === 'submissions') {
      setTargetClassFilter(param);
    }
    if (tab === 'results') {
      setTargetGameId(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadCount = notifications.filter((n) => n.unread ?? !n.read).length;

  // Render Student Task Mode
  if (appMode === 'student_task') {
    return (
      <StudentTaskView
        tasks={tasks}
        classes={classes}
        initialTaskId={activeStudentTaskId}
        onBackToTeacher={() => {
          setAppMode('teacher');
          // Clean URL params without reloading
          window.history.pushState({}, '', window.location.pathname);
          reloadData();
        }}
        onSubmissionSuccess={() => {
          reloadData();
        }}
        onOpenStudentPortal={(stId, clsId) => {
          if (stId) setPortalStudentId(stId);
          if (clsId) setPortalClassId(clsId);
          setAppMode('student_portal');
        }}
      />
    );
  }

  // Render Student Game Mode
  if (appMode === 'student_game') {
    return (
      <StudentGameView
        games={games}
        classes={classes}
        initialGameId={activeStudentGameId}
        onBackToTeacher={() => {
          setAppMode('teacher');
          window.history.pushState({}, '', window.location.pathname);
          reloadData();
        }}
        onOpenStudentPortal={(stId, clsId) => {
          if (stId) setPortalStudentId(stId);
          if (clsId) setPortalClassId(clsId);
          setAppMode('student_portal');
        }}
      />
    );
  }

  // Render Student Portal Mode (Account & Scorebook)
  if (appMode === 'student_portal') {
    return (
      <StudentPortalView
        classes={classes}
        students={students}
        submissions={submissions}
        gameResults={gameResults}
        tasks={tasks}
        games={games}
        initialStudentId={portalStudentId}
        initialClassId={portalClassId}
        onNavigateToTask={(taskId) => {
          setActiveStudentTaskId(taskId || tasks[0]?.id || '');
          setAppMode('student_task');
        }}
        onNavigateToGame={(gameId) => {
          setActiveStudentGameId(gameId || games[0]?.id || '');
          setAppMode('student_game');
        }}
        onBackToTeacher={() => {
          setAppMode('teacher');
          window.history.pushState({}, '', window.location.pathname);
          reloadData();
        }}
        onRefresh={reloadData}
      />
    );
  }

  // Teacher Experience
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isStudentMode={false}
        onToggleStudentMode={() => {
          setAppMode('student_task');
        }}
        onOpenStudentPortal={() => {
          setAppMode('student_portal');
        }}
        unreadCount={unreadCount}
        onDataRefresh={reloadData}
        isOwner={isOwner}
        onOpenLoginModal={() => handleRequestLogin()}
        onLogout={handleLogout}
      />

      {/* Main Tab Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
        unreadCount={unreadCount}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <TeacherDashboard
            classes={classes}
            tasks={tasks}
            submissions={submissions}
            games={games}
            gameResults={gameResults}
            onNavigate={handleNavigate}
            onOpenCreateTask={() => {
              if (!isOwner) {
                handleRequestLogin('Chỉ chủ tài khoản mới có quyền tạo nhiệm vụ mới!');
                return;
              }
              setEditingTask(null);
              setIsCreateTaskOpen(true);
            }}
            onOpenCreateGame={() => {
              if (!isOwner) {
                handleRequestLogin('Chỉ chủ tài khoản mới có quyền tạo trò chơi mới!');
                return;
              }
              setEditingGame(null);
              setIsCreateGameOpen(true);
            }}
            onShowQR={handleShowQR}
            onOpenSubmissionPreview={(sub) => setPreviewSubmission(sub)}
            isOwner={isOwner}
            onRequestLogin={() => handleRequestLogin()}
          />
        )}

        {currentTab === 'classes' && (
          <ClassManagement
            classes={classes}
            students={students}
            tasks={tasks}
            submissions={submissions}
            games={games}
            gameResults={gameResults}
            onNavigate={handleNavigate}
            onRefresh={reloadData}
            onOpenStudentRoster={(cid) => setStudentRosterModal({ isOpen: true, classId: cid || 'ALL' })}
            isOwner={isOwner}
            onRequestLogin={() => handleRequestLogin('Chỉ chủ tài khoản mới có quyền chỉnh sửa, thêm mới lớp học!')}
          />
        )}

        {currentTab === 'students' && (
          <StudentManagementView
            classes={classes}
            students={students}
            submissions={submissions}
            gameResults={gameResults}
            initialClassId={targetClassFilter}
            onRefresh={reloadData}
            onOpenStudentPortal={(studentId, classId) => {
              setPortalStudentId(studentId || '');
              setPortalClassId(classId || '10A');
              setAppMode('student_portal');
            }}
            isOwner={isOwner}
            onRequestLogin={() => handleRequestLogin('Chỉ chủ tài khoản mới có quyền thêm mới, chỉnh sửa, xóa học sinh!')}
          />
        )}

        {currentTab === 'tasks' && (
          <TaskManagement
            tasks={tasks}
            classes={classes}
            submissions={submissions}
            selectedClassFilter={targetClassFilter}
            onOpenCreateTask={(taskToEdit) => {
              if (!isOwner) {
                handleRequestLogin('Chỉ chủ tài khoản mới có quyền tạo hoặc chỉnh sửa nhiệm vụ!');
                return;
              }
              setEditingTask(taskToEdit || null);
              setIsCreateTaskOpen(true);
            }}
            onShowQR={handleShowQR}
            onOpenSubmissionPreview={(sub) => setPreviewSubmission(sub)}
            onRefresh={reloadData}
            isOwner={isOwner}
            onRequestLogin={() => handleRequestLogin('Chỉ chủ tài khoản mới có quyền thêm mới hoặc chỉnh sửa nhiệm vụ!')}
            onOpenStudentTaskPreview={(taskId) => {
              setActiveStudentTaskId(taskId);
              setAppMode('student_task');
            }}
          />
        )}

        {currentTab === 'submissions' && (
          <SubmissionsRepository
            classes={classes}
            tasks={tasks}
            submissions={submissions}
            selectedClassFilter={targetClassFilter}
            onOpenSubmissionPreview={(sub) => setPreviewSubmission(sub)}
          />
        )}

        {currentTab === 'games' && (
          <GameManagement
            games={games}
            classes={classes}
            gameResults={gameResults}
            onOpenCreateGame={(gameToEdit) => {
              if (!isOwner) {
                handleRequestLogin('Chỉ chủ tài khoản mới có quyền tạo hoặc chỉnh sửa trò chơi!');
                return;
              }
              setEditingGame(gameToEdit || null);
              setIsCreateGameOpen(true);
            }}
            onShowQR={handleShowQR}
            onNavigateToResults={(gameId) => {
              setTargetGameId(gameId);
              setCurrentTab('results');
            }}
            onRefresh={reloadData}
            onTestPlayGame={(gameId) => {
              setActiveStudentGameId(gameId);
              setAppMode('student_game');
            }}
            isOwner={isOwner}
            onRequestLogin={() => handleRequestLogin('Chỉ chủ tài khoản mới có quyền thêm mới hoặc chỉnh sửa trò chơi!')}
          />
        )}

        {currentTab === 'results' && (
          <GameResultsAndHonor
            games={games}
            classes={classes}
            gameResults={gameResults}
            initialGameId={targetGameId}
          />
        )}

        {currentTab === 'stats' && (
          <Statistics
            classes={classes}
            tasks={tasks}
            submissions={submissions}
            games={games}
            gameResults={gameResults}
          />
        )}

        {currentTab === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onRefresh={reloadData}
            onNavigateToItem={(type, refId) => {
              if (type === 'submission') {
                const sub = submissions.find((s) => s.id === refId);
                if (sub) {
                  setPreviewSubmission(sub);
                } else {
                  setCurrentTab('submissions');
                }
              } else if (type === 'game') {
                setCurrentTab('results');
              } else {
                setCurrentTab('tasks');
              }
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">LỚP HỌC SỐ – CÔ GIÁO NGUYỄN THỊ DUNG</span>
            <span>·</span>
            <span>Ứng dụng giáo dục THPT (Khối 10, 11, 12)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Không cần đăng nhập học sinh</span>
            <span>·</span>
            <span>Xuất link trực tiếp & Mã QR</span>
            <span>·</span>
            <span>Lưu trữ lâu dài</span>
          </div>
        </div>
      </footer>

      {/* QR Code Modal (Supports Projector / Slide Mode) */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        title={qrModal.title}
        subtitle={qrModal.subtitle}
        type={qrModal.type}
        codeId={qrModal.id}
      />

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setEditingTask(null);
        }}
        classes={classes}
        initialTask={editingTask}
        onTaskCreated={(newTask) => {
          reloadData();
          handleShowQR('task', newTask.id, newTask.title, `Lớp: ${newTask.classIds.join(', ')}`);
        }}
      />

      {/* Create / Edit Game Modal */}
      <CreateGameModal
        isOpen={isCreateGameOpen}
        onClose={() => {
          setIsCreateGameOpen(false);
          setEditingGame(null);
        }}
        classes={classes}
        initialGame={editingGame}
        onGameCreated={(newGame) => {
          reloadData();
          handleShowQR('game', newGame.id, newGame.title, `Lớp: ${newGame.classIds.join(', ')}`);
        }}
      />

      {/* Submission Preview & Grading Modal */}
      <SubmissionPreviewModal
        submission={previewSubmission}
        onClose={() => setPreviewSubmission(null)}
        onUpdated={() => {
          reloadData();
        }}
        isOwner={isOwner}
        onRequestLogin={() => handleRequestLogin('Chỉ chủ tài khoản mới có quyền chấm điểm bài nộp!')}
      />

      {/* Student Roster Modal */}
      <StudentRosterModal
        isOpen={studentRosterModal.isOpen}
        onClose={() => setStudentRosterModal({ ...studentRosterModal, isOpen: false })}
        classes={classes}
        selectedClassId={studentRosterModal.classId}
        students={students}
        submissions={submissions}
        gameResults={gameResults}
        onRefresh={reloadData}
      />

      {/* Login Modal for Owner (Cô Dung: nguyendung1347 / Linh123@) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginPurposeMessage(undefined);
        }}
        purposeMessage={loginPurposeMessage}
        onSuccess={() => {
          setIsOwner(true);
          reloadData();
        }}
      />
    </div>
  );
};
