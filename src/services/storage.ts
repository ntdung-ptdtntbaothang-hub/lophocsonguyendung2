import { Classroom, Student, Task, Submission, Game, GameResult, NotificationItem } from '../types';
import {
  DEFAULT_CLASSES,
  DEFAULT_STUDENTS,
  DEFAULT_TASKS,
  DEFAULT_SUBMISSIONS,
  DEFAULT_GAMES,
  DEFAULT_GAME_RESULTS,
  DEFAULT_NOTIFICATIONS,
} from '../data/defaultData';
import { decodeTaskFromUrl } from './taskLink';

const STORAGE_KEYS = {
  CLASSES: 'lop_hoc_so_classes',
  STUDENTS: 'lop_hoc_so_students',
  TASKS: 'lop_hoc_so_tasks',
  SUBMISSIONS: 'lop_hoc_so_submissions',
  GAMES: 'lop_hoc_so_games',
  GAME_RESULTS: 'lop_hoc_so_game_results',
  NOTIFICATIONS: 'lop_hoc_so_notifications',
};

type Listener = () => void;

class StorageService {
  private listeners: Set<Listener> = new Set();
  private pollInterval: any = null;
  private isSyncing = false;
  private lastServerVersion = 0;

  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  // --- Initialize Storage ---
  public initialize(): void {
    const SUBJECT_VERSION_KEY = 'lop_hoc_so_subject_version';
    const CURRENT_VERSION = 'tin_hoc_v4_robust';
    const existingVersion = localStorage.getItem(SUBJECT_VERSION_KEY);

    if (existingVersion !== CURRENT_VERSION) {
      // Preserve any user-created tasks while migrating
      const existingTasks = this.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
      const userTasks = existingTasks.filter((t) => t.id.startsWith('task-17'));

      this.setItem(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
      this.setItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
      this.setItem(STORAGE_KEYS.TASKS, [...userTasks, ...DEFAULT_TASKS]);
      this.setItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
      this.setItem(STORAGE_KEYS.GAMES, DEFAULT_GAMES);
      this.setItem(STORAGE_KEYS.GAME_RESULTS, DEFAULT_GAME_RESULTS);
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      localStorage.setItem(SUBJECT_VERSION_KEY, CURRENT_VERSION);
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
        this.setItem(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
        this.setItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
        this.setItem(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
        this.setItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.GAMES)) {
        this.setItem(STORAGE_KEYS.GAMES, DEFAULT_GAMES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.GAME_RESULTS)) {
        this.setItem(STORAGE_KEYS.GAME_RESULTS, DEFAULT_GAME_RESULTS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      }
    }

    this.recalculateAllScores();

    // Check if URL contains encoded task data (tdata)
    this.adoptTaskFromCurrentUrl();

    // Start background syncing with server
    this.syncFromServer();
    this.startAutoSync();
  }

  // Parse task directly from URL if present
  public adoptTaskFromCurrentUrl(): Task | null {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const tdata = params.get('tdata');
      if (tdata) {
        const decoded = decodeTaskFromUrl(tdata);
        if (decoded && decoded.id) {
          this.saveTask(decoded);
          return decoded;
        }
      }
    } catch (e) {
      console.warn('Could not adopt task from URL:', e);
    }
    return null;
  }

  public startAutoSync(): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.syncFromServer();
    }, 3000);
  }

  public stopAutoSync(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Two-way synchronization: merges server data with any pending local data and uploads missing items
  public async syncFromServer(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || !Array.isArray(data.tasks)) {
        throw new Error('Invalid data payload from server');
      }

      const localTasks = this.getTasks();
      const serverTasks: Task[] = Array.isArray(data.tasks) ? data.tasks : [];
      const serverTaskIds = new Set(serverTasks.map((t) => t.id));

      // Identify any local tasks that server doesn't have yet (e.g. created while offline)
      const missingTasksOnServer = localTasks.filter((t) => !serverTaskIds.has(t.id));
      if (missingTasksOnServer.length > 0) {
        missingTasksOnServer.forEach((t) => {
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }).catch(console.error);
        });
      }

      // Identify any local submissions that server doesn't have yet
      const localSubs = this.getSubmissions();
      const serverSubs: Submission[] = Array.isArray(data.submissions) ? data.submissions : [];
      const serverSubIds = new Set(serverSubs.map((s) => s.id));
      const missingSubsOnServer = localSubs.filter((s) => !serverSubIds.has(s.id));
      if (missingSubsOnServer.length > 0) {
        missingSubsOnServer.forEach((s) => {
          fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s),
          }).catch(console.error);
        });
      }

      // Merged tasks & submissions
      const mergedTasks = [...missingTasksOnServer, ...serverTasks];
      const mergedSubs = [...missingSubsOnServer, ...serverSubs];

      const hasChanged =
        data.version !== this.lastServerVersion ||
        mergedTasks.length !== localTasks.length ||
        mergedSubs.length !== localSubs.length;

      this.lastServerVersion = data.version || Date.now();

      if (hasChanged) {
        if (Array.isArray(data.classes)) this.setItem(STORAGE_KEYS.CLASSES, data.classes);
        if (Array.isArray(data.students)) this.setItem(STORAGE_KEYS.STUDENTS, data.students);
        this.setItem(STORAGE_KEYS.TASKS, mergedTasks);
        this.setItem(STORAGE_KEYS.SUBMISSIONS, mergedSubs);
        if (Array.isArray(data.games)) this.setItem(STORAGE_KEYS.GAMES, data.games);
        if (Array.isArray(data.gameResults)) this.setItem(STORAGE_KEYS.GAME_RESULTS, data.gameResults);
        if (Array.isArray(data.notifications)) this.setItem(STORAGE_KEYS.NOTIFICATIONS, data.notifications);

        this.notifyListeners();
      }

      return true;
    } catch (err) {
      // Graceful fallback to local cache
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Fetch single task by ID directly from server if not found in local cache
  public async fetchTaskById(id: string): Promise<Task | undefined> {
    const existing = this.getTaskById(id);
    if (existing) return existing;

    try {
      const res = await fetch(`/api/tasks/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const task: Task = await res.json();
        if (task && task.id) {
          const list = this.getTasks();
          const idx = list.findIndex((t) => t.id === task.id);
          if (idx >= 0) {
            list[idx] = task;
          } else {
            list.unshift(task);
          }
          this.setItem(STORAGE_KEYS.TASKS, list);
          this.notifyListeners();
          return task;
        }
      }
    } catch (err) {
      console.warn('Could not fetch task from server:', err);
    }

    return undefined;
  }

  // --- Classes ---
  public getClasses(): Classroom[] {
    return this.getItem(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
  }

  public getClassById(id: string): Classroom | undefined {
    return this.getClasses().find((c) => c.id === id);
  }

  public saveClass(classroom: Classroom): Classroom {
    const list = this.getClasses();
    const index = list.findIndex((c) => c.id === classroom.id);
    if (index >= 0) {
      list[index] = classroom;
    } else {
      list.push(classroom);
    }
    this.setItem(STORAGE_KEYS.CLASSES, list);
    this.notifyListeners();

    fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classroom),
    }).catch(console.error);

    return classroom;
  }

  public deleteClass(classId: string): void {
    const list = this.getClasses().filter((c) => c.id !== classId);
    this.setItem(STORAGE_KEYS.CLASSES, list);
    this.notifyListeners();
  }

  // --- Students ---
  public getStudents(): Student[] {
    return this.getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  }

  public getStudentsByClass(classId: string): Student[] {
    const list = this.getStudents();
    if (!classId || classId === 'ALL') return list;
    return list.filter((s) => s.classId === classId);
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  }

  public getStudentByCodeOrName(classId: string, query: string): Student | undefined {
    const students = this.getStudentsByClass(classId);
    const q = query.toLowerCase().trim();
    return students.find((s) => {
      const matchCode = s.studentCode && s.studentCode.toLowerCase() === q;
      const matchName = s.name.toLowerCase() === q;
      return matchCode || matchName;
    });
  }

  public findOrCreateStudent(name: string, classId: string): Student {
    const normName = name.trim();
    let student = this.getStudents().find(
      (s) => s.classId === classId && s.name.toLowerCase().trim() === normName.toLowerCase()
    );

    if (!student) {
      const clsStudents = this.getStudentsByClass(classId);
      const count = clsStudents.length + 1;
      const code = `HS${classId}${count < 10 ? '0' + count : count}`;
      student = {
        id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        studentCode: code,
        name: normName,
        classId: classId,
        createdAt: new Date().toISOString(),
        totalScore: 0,
        submissionScore: 0,
        gameScore: 0,
        bonusScore: 0,
        submissionCount: 0,
        gameCount: 0,
        badges: [],
        scoreHistory: [],
      };
      this.saveStudent(student);
    }
    return student;
  }

  public recalculateAllScores(): void {
    const students = this.getStudents();
    const submissions = this.getSubmissions();
    const gameResults = this.getGameResults();

    students.forEach((student) => {
      const stuSubs = submissions.filter(
        (s) =>
          s.studentClass === student.classId &&
          s.studentName.toLowerCase().trim() === student.name.toLowerCase().trim()
      );
      const stuGames = gameResults.filter(
        (g) =>
          g.studentClass === student.classId &&
          g.studentName.toLowerCase().trim() === student.name.toLowerCase().trim()
      );

      let subScore = 0;
      const history: any[] = [];

      stuSubs.forEach((sub) => {
        subScore += 10;
        history.push({
          id: `hist-sub-${sub.id}`,
          type: 'submission',
          title: `Nộp bài: ${sub.taskTitle}`,
          pointsEarned: 10,
          date: sub.submittedAt,
          referenceId: sub.taskId,
        });

        if (sub.score !== undefined && sub.score !== null) {
          const gradePoints = Math.round(Number(sub.score) * 10);
          subScore += gradePoints;
          history.push({
            id: `hist-grade-${sub.id}`,
            type: 'review',
            title: `Cô Dung chấm điểm: ${sub.taskTitle} (${sub.score}/10đ)`,
            pointsEarned: gradePoints,
            date: sub.submittedAt,
            note: sub.teacherFeedback || 'Đã chấm điểm hoàn thành nhiệm vụ',
            referenceId: sub.id,
          });
        }
      });

      let gameScore = 0;
      stuGames.forEach((res) => {
        gameScore += res.score;
        history.push({
          id: `hist-game-${res.id}`,
          type: 'game',
          title: `Trò chơi củng cố: ${res.gameTitle} (${res.correctCount}/${res.totalQuestions} đúng)`,
          pointsEarned: res.score,
          date: res.completedAt,
          referenceId: res.gameId,
        });
      });

      const bonus = student.bonusScore || 0;
      if (student.scoreHistory) {
        student.scoreHistory
          .filter((h) => h.type === 'bonus')
          .forEach((b) => {
            if (!history.find((x) => x.id === b.id)) {
              history.push(b);
            }
          });
      }

      const total = subScore + gameScore + bonus;

      const badges: any[] = [];
      if (stuSubs.length >= 1) {
        badges.push({
          id: 'badge-first-sub',
          name: 'Tiên Phong Nộp Bài',
          icon: 'target',
          description: 'Đã hoàn thành và nộp bài tập đúng hạn',
          earnedAt: stuSubs[0].submittedAt,
        });
      }
      if (stuSubs.length >= 2) {
        badges.push({
          id: 'badge-hardworking',
          name: 'Chiến Binh Chăm Chỉ',
          icon: 'flame',
          description: 'Nộp từ 2 bài tập trở lên',
          earnedAt: stuSubs[stuSubs.length - 1].submittedAt,
        });
      }
      if (stuGames.length >= 1) {
        badges.push({
          id: 'badge-first-game',
          name: 'Khám Phá Trò Chơi',
          icon: 'zap',
          description: 'Đã tham gia thử thách trò chơi Tin học',
          earnedAt: stuGames[0].completedAt,
        });
      }
      if (stuGames.some((g) => g.score >= 100)) {
        badges.push({
          id: 'badge-perfect-score',
          name: 'Thủ Khoa Trắc Nghiệm',
          icon: 'trophy',
          description: 'Đạt điểm tuyệt đối 100/100 trong trò chơi củng cố',
          earnedAt: new Date().toISOString(),
        });
      }
      if (total >= 150) {
        badges.push({
          id: 'badge-tech-star',
          name: 'Ngôi Sao Tin Học',
          icon: 'star',
          description: 'Đạt tổng điểm tích lũy trên 150 điểm môn Tin học',
          earnedAt: new Date().toISOString(),
        });
      }

      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      student.submissionScore = subScore;
      student.gameScore = gameScore;
      student.bonusScore = bonus;
      student.totalScore = total;
      student.submissionCount = stuSubs.length;
      student.gameCount = stuGames.length;
      student.badges = badges;
      student.scoreHistory = history;
    });

    const classIds = Array.from(new Set(students.map((s) => s.classId)));
    classIds.forEach((cid) => {
      const inClass = students.filter((s) => s.classId === cid);
      inClass.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      inClass.forEach((st, idx) => {
        st.rankInClass = idx + 1;
      });
    });

    this.setItem(STORAGE_KEYS.STUDENTS, students);
  }

  public addBonusScore(studentId: string, points: number, reason: string): void {
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (student) {
      student.bonusScore = (student.bonusScore || 0) + points;
      const historyItem = {
        id: `hist-bonus-${Date.now()}`,
        type: 'bonus' as const,
        title: reason || 'Cô Dung thưởng điểm phát biểu / rèn luyện',
        pointsEarned: points,
        date: new Date().toISOString(),
        note: 'Điểm thưởng trực tiếp từ giáo viên',
      };
      student.scoreHistory = [historyItem, ...(student.scoreHistory || [])];
      this.setItem(STORAGE_KEYS.STUDENTS, students);
      this.recalculateAllScores();
      this.notifyListeners();

      fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      }).catch(console.error);
    }
  }

  public saveStudent(student: Student): Student {
    const list = this.getStudents();
    const index = list.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      list[index] = student;
    } else {
      list.push(student);
    }
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.updateClassStudentCount(student.classId);
    this.recalculateAllScores();
    this.notifyListeners();

    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    }).catch(console.error);

    return student;
  }

  public saveStudents(newStudents: Student[]): void {
    const list = this.getStudents();
    newStudents.forEach((stu) => {
      const idx = list.findIndex(
        (s) =>
          s.id === stu.id ||
          (s.studentCode &&
            stu.studentCode &&
            s.studentCode === stu.studentCode &&
            s.classId === stu.classId)
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...stu };
      } else {
        list.push(stu);
      }
    });
    this.setItem(STORAGE_KEYS.STUDENTS, list);

    const affectedClasses = Array.from(new Set(newStudents.map((s) => s.classId)));
    affectedClasses.forEach((cid) => this.updateClassStudentCount(cid));
    this.recalculateAllScores();
    this.notifyListeners();

    newStudents.forEach((st) => {
      fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(st),
      }).catch(console.error);
    });
  }

  public deleteStudent(studentId: string): void {
    const list = this.getStudents();
    const student = list.find((s) => s.id === studentId);
    const filtered = list.filter((s) => s.id !== studentId);
    this.setItem(STORAGE_KEYS.STUDENTS, filtered);
    if (student) {
      this.updateClassStudentCount(student.classId);
    }
    this.notifyListeners();

    fetch(`/api/students/${studentId}`, { method: 'DELETE' }).catch(console.error);
  }

  public deleteStudents(studentIds: string[]): void {
    const list = this.getStudents();
    const idSet = new Set(studentIds);
    const affectedClasses = new Set(list.filter((s) => idSet.has(s.id)).map((s) => s.classId));
    const filtered = list.filter((s) => !idSet.has(s.id));
    this.setItem(STORAGE_KEYS.STUDENTS, filtered);
    affectedClasses.forEach((cid) => this.updateClassStudentCount(cid));
    this.notifyListeners();

    studentIds.forEach((id) => {
      fetch(`/api/students/${id}`, { method: 'DELETE' }).catch(console.error);
    });
  }

  private updateClassStudentCount(classId: string): void {
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      const count = this.getStudentsByClass(classId).length;
      cls.studentCount = count;
      this.setItem(STORAGE_KEYS.CLASSES, classes);
    }
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    const list = this.getItem(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    return list.map((t) => ({
      ...t,
      startDate: t.startDate || t.createdAt?.slice(0, 16) || '2026-09-01T08:00',
      endDate: t.endDate || t.deadline || '2026-10-30T23:59',
      deadline: t.endDate || t.deadline || '2026-10-30T23:59',
    }));
  }

  public getTaskById(id: string): Task | undefined {
    return this.getTasks().find((t) => t.id === id);
  }

  public saveTask(task: Task): Task {
    const list = this.getTasks();
    const index = list.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      list[index] = task;
    } else {
      list.unshift(task);
    }
    this.setItem(STORAGE_KEYS.TASKS, list);
    this.notifyListeners();

    // Sync to server immediately
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    }).catch(console.error);

    return task;
  }

  public deleteTask(taskId: string): void {
    const list = this.getTasks().filter((t) => t.id !== taskId);
    this.setItem(STORAGE_KEYS.TASKS, list);
    this.notifyListeners();

    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' }).catch(console.error);
  }

  // --- Submissions ---
  public getSubmissions(): Submission[] {
    return this.getItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  }

  public getSubmissionsByTaskId(taskId: string): Submission[] {
    return this.getSubmissions().filter((s) => s.taskId === taskId);
  }

  public getSubmissionsByClass(classId: string): Submission[] {
    return this.getSubmissions().filter(
      (s) => s.studentClass === classId || s.studentClass.includes(classId)
    );
  }

  public addSubmission(submission: Submission): Submission {
    const list = this.getSubmissions();
    const existingIdx = list.findIndex((s) => s.id === submission.id);
    if (existingIdx >= 0) {
      list[existingIdx] = submission;
    } else {
      list.unshift(submission);
    }
    this.setItem(STORAGE_KEYS.SUBMISSIONS, list);

    // Auto-create or find student account & award points
    this.findOrCreateStudent(submission.studentName, submission.studentClass);
    this.recalculateAllScores();

    // Auto-generate notification
    this.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Học sinh nộp bài mới',
      message: `${submission.studentName} – ${submission.studentClass} vừa nộp bài cho “${submission.taskTitle}” (+10 điểm chuyên cần vào tài khoản).`,
      time: 'Vừa xong',
      type: 'submission',
      unread: true,
      linkTab: 'submissions',
      linkId: submission.id,
    });

    this.notifyListeners();

    // Post to server immediately
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    }).catch(console.error);

    return submission;
  }

  public saveSubmission(submission: Submission): Submission {
    return this.addSubmission(submission);
  }

  public updateSubmission(submission: Submission): void {
    const list = this.getSubmissions();
    const index = list.findIndex((s) => s.id === submission.id);
    if (index >= 0) {
      list[index] = submission;
      this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
      this.recalculateAllScores();
      this.notifyListeners();

      fetch(`/api/submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      }).catch(console.error);
    }
  }

  public deleteSubmission(subId: string): void {
    const list = this.getSubmissions().filter((s) => s.id !== subId);
    this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
    this.recalculateAllScores();
    this.notifyListeners();

    fetch(`/api/submissions/${subId}`, { method: 'DELETE' }).catch(console.error);
  }

  // --- Games ---
  public getGames(): Game[] {
    return this.getItem(STORAGE_KEYS.GAMES, DEFAULT_GAMES);
  }

  public getGameById(id: string): Game | undefined {
    return this.getGames().find((g) => g.id === id);
  }

  public saveGame(game: Game): Game {
    const list = this.getGames();
    const index = list.findIndex((g) => g.id === game.id);
    if (index >= 0) {
      list[index] = game;
    } else {
      list.unshift(game);
    }
    this.setItem(STORAGE_KEYS.GAMES, list);
    this.notifyListeners();

    fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game),
    }).catch(console.error);

    return game;
  }

  public deleteGame(gameId: string): void {
    const list = this.getGames().filter((g) => g.id !== gameId);
    this.setItem(STORAGE_KEYS.GAMES, list);
    this.notifyListeners();

    fetch(`/api/games/${gameId}`, { method: 'DELETE' }).catch(console.error);
  }

  public incrementGamePlay(gameId: string): void {
    const list = this.getGames();
    const game = list.find((g) => g.id === gameId);
    if (game) {
      game.playCount = (game.playCount || 0) + 1;
      this.setItem(STORAGE_KEYS.GAMES, list);
    }
  }

  // --- Game Results & Rankings ---
  public getGameResults(): GameResult[] {
    return this.getItem(STORAGE_KEYS.GAME_RESULTS, DEFAULT_GAME_RESULTS);
  }

  public getResultsByGameId(gameId: string): GameResult[] {
    return this.getGameResults()
      .filter((r) => r.gameId === gameId)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeSpentSeconds - b.timeSpentSeconds;
      });
  }

  public addGameResult(result: GameResult): GameResult {
    const list = this.getGameResults();
    list.unshift(result);
    this.setItem(STORAGE_KEYS.GAME_RESULTS, list);
    this.incrementGamePlay(result.gameId);

    this.findOrCreateStudent(result.studentName, result.studentClass);
    this.recalculateAllScores();

    this.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Hoàn thành trò chơi củng cố',
      message: `${result.studentName} – ${result.studentClass} vừa đạt ${result.score}/${result.maxScore} điểm trò chơi “${result.gameTitle}” (+${result.score} điểm vào tài khoản).`,
      time: 'Vừa xong',
      type: 'game',
      unread: true,
      linkTab: 'results',
      linkId: result.gameId,
    });

    this.notifyListeners();

    fetch('/api/game-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }).catch(console.error);

    return result;
  }

  public saveGameResult(result: GameResult): GameResult {
    return this.addGameResult(result);
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  }

  public addNotification(item: NotificationItem): void {
    const list = this.getNotifications();
    list.unshift(item);
    if (list.length > 50) list.pop();
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications().map((n) =>
      n.id === id ? { ...n, unread: false, read: true } : n
    );
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    this.notifyListeners();

    fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(console.error);
  }

  public markAllNotificationsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, unread: false, read: true }));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    this.notifyListeners();

    fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(console.error);
  }

  // --- Export & Reset ---
  public exportData(): string {
    const fullData = {
      classes: this.getClasses(),
      students: this.getStudents(),
      tasks: this.getTasks(),
      submissions: this.getSubmissions(),
      games: this.getGames(),
      gameResults: this.getGameResults(),
      notifications: this.getNotifications(),
      exportedAt: new Date().toISOString(),
      teacherName: 'Cô giáo Nguyễn Thị Dung',
      schoolSystem: 'Lớp Học Số THPT',
    };
    return JSON.stringify(fullData, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.classes) this.setItem(STORAGE_KEYS.CLASSES, data.classes);
      if (data.students) this.setItem(STORAGE_KEYS.STUDENTS, data.students);
      if (data.tasks) this.setItem(STORAGE_KEYS.TASKS, data.tasks);
      if (data.submissions) this.setItem(STORAGE_KEYS.SUBMISSIONS, data.submissions);
      if (data.games) this.setItem(STORAGE_KEYS.GAMES, data.games);
      if (data.gameResults) this.setItem(STORAGE_KEYS.GAME_RESULTS, data.gameResults);
      if (data.notifications) this.setItem(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
      this.recalculateAllScores();
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  public resetToSampleData(): void {
    this.setItem(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
    this.setItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    this.setItem(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    this.setItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
    this.setItem(STORAGE_KEYS.GAMES, DEFAULT_GAMES);
    this.setItem(STORAGE_KEYS.GAME_RESULTS, DEFAULT_GAME_RESULTS);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    this.recalculateAllScores();
    this.notifyListeners();

    fetch('/api/reset', { method: 'POST' }).catch(console.error);
  }
}

export const storage = new StorageService();
// Run init immediately
storage.initialize();
