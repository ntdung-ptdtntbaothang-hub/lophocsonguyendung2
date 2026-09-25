import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  DEFAULT_CLASSES,
  DEFAULT_STUDENTS,
  DEFAULT_TASKS,
  DEFAULT_SUBMISSIONS,
  DEFAULT_GAMES,
  DEFAULT_GAME_RESULTS,
  DEFAULT_NOTIFICATIONS,
} from './src/data/defaultData.js';
import { Classroom, Student, Task, Submission, Game, GameResult, NotificationItem } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'lop_hoc_so_db.json');

interface DatabaseSchema {
  classes: Classroom[];
  students: Student[];
  tasks: Task[];
  submissions: Submission[];
  games: Game[];
  gameResults: GameResult[];
  notifications: NotificationItem[];
  version: number;
}

// Ensure database file exists
function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    } catch (err) {
      console.error('Error reading db file, re-initializing with defaults', err);
    }
  }

  const initialData: DatabaseSchema = {
    classes: DEFAULT_CLASSES,
    students: DEFAULT_STUDENTS,
    tasks: DEFAULT_TASKS,
    submissions: DEFAULT_SUBMISSIONS,
    games: DEFAULT_GAMES,
    gameResults: DEFAULT_GAME_RESULTS,
    notifications: DEFAULT_NOTIFICATIONS,
    version: Date.now(),
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.version = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file', err);
  }
}

// Recalculate student scores & rankings
function recalculateScores(db: DatabaseSchema) {
  const students = db.students;
  const submissions = db.submissions;
  const gameResults = db.gameResults;

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
}

function findOrCreateStudent(db: DatabaseSchema, name: string, classId: string): Student {
  const normName = name.trim();
  let student = db.students.find(
    (s) => s.classId === classId && s.name.toLowerCase().trim() === normName.toLowerCase()
  );

  if (!student) {
    const clsCount = db.students.filter((s) => s.classId === classId).length + 1;
    const code = `HS${classId}${clsCount < 10 ? '0' + clsCount : clsCount}`;
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
    db.students.push(student);

    const cls = db.classes.find((c) => c.id === classId);
    if (cls) {
      cls.studentCount = db.students.filter((s) => s.classId === classId).length;
    }
  }

  return student;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for large payload (submission files, images, etc.)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  let db = loadDatabase();

  // Reload database state on every API request to guarantee live consistency across processes/devices
  app.use('/api', (_req, _res, next) => {
    try {
      db = loadDatabase();
    } catch (e) {
      console.error('Error reloading db:', e);
    }
    next();
  });

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // GET all database state
  app.get('/api/data', (_req, res) => {
    res.json(db);
  });

  // GET single task by ID
  app.get('/api/tasks/:id', (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Nhiệm vụ không tồn tại' });
    }
    res.json(task);
  });

  // POST create or update task
  app.post('/api/tasks', (req, res) => {
    const task: Task = req.body;
    if (!task || !task.id || !task.title) {
      return res.status(400).json({ error: 'Thông tin nhiệm vụ không hợp lệ' });
    }

    const idx = db.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      db.tasks[idx] = { ...db.tasks[idx], ...task };
    } else {
      db.tasks.unshift(task);
    }

    // Add notification if new task
    if (idx < 0) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Nhiệm vụ học tập mới',
        message: `Cô Dung vừa giao nhiệm vụ “${task.title}” cho lớp ${task.classIds.join(', ')}.`,
        time: 'Vừa xong',
        type: 'system',
        unread: true,
        linkTab: 'tasks',
        linkId: task.id,
      });
      if (db.notifications.length > 50) db.notifications.pop();
    }

    saveDatabase(db);
    res.json(task);
  });

  // DELETE task
  app.delete('/api/tasks/:id', (req, res) => {
    db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // GET submissions
  app.get('/api/submissions', (req, res) => {
    const { taskId, classId } = req.query;
    let list = db.submissions;
    if (taskId && typeof taskId === 'string') {
      list = list.filter((s) => s.taskId === taskId);
    }
    if (classId && typeof classId === 'string') {
      list = list.filter((s) => s.studentClass === classId || s.studentClass.includes(classId));
    }
    res.json(list);
  });

  // POST new submission (student submits homework)
  app.post('/api/submissions', (req, res) => {
    const submission: Submission = req.body;
    if (!submission || !submission.taskId || !submission.studentName) {
      return res.status(400).json({ error: 'Dữ liệu bài nộp không hợp lệ' });
    }

    if (!submission.id) {
      submission.id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    if (!submission.submittedAt) {
      submission.submittedAt = new Date().toISOString();
    }
    if (!submission.status) {
      submission.status = 'submitted';
    }

    // Remove existing if duplicate ID
    db.submissions = db.submissions.filter((s) => s.id !== submission.id);
    db.submissions.unshift(submission);

    // Auto-create/find student and update scores
    findOrCreateStudent(db, submission.studentName, submission.studentClass);
    recalculateScores(db);

    // Add notification for teacher
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Học sinh nộp bài mới',
      message: `${submission.studentName} – ${submission.studentClass} vừa nộp bài cho “${submission.taskTitle}”.`,
      time: 'Vừa xong',
      type: 'submission',
      unread: true,
      linkTab: 'submissions',
      linkId: submission.id,
    });
    if (db.notifications.length > 50) db.notifications.pop();

    saveDatabase(db);
    res.json(submission);
  });

  // PUT update submission (grading/reviewing)
  app.put('/api/submissions/:id', (req, res) => {
    const subId = req.params.id;
    const idx = db.submissions.findIndex((s) => s.id === subId);
    if (idx >= 0) {
      db.submissions[idx] = { ...db.submissions[idx], ...req.body };
      recalculateScores(db);
      saveDatabase(db);
      return res.json(db.submissions[idx]);
    }
    res.status(404).json({ error: 'Không tìm thấy bài nộp' });
  });

  // DELETE submission
  app.delete('/api/submissions/:id', (req, res) => {
    db.submissions = db.submissions.filter((s) => s.id !== req.params.id);
    recalculateScores(db);
    saveDatabase(db);
    res.json({ success: true });
  });

  // POST create or update game
  app.post('/api/games', (req, res) => {
    const game: Game = req.body;
    if (!game || !game.id || !game.title) {
      return res.status(400).json({ error: 'Thông tin trò chơi không hợp lệ' });
    }
    const idx = db.games.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      db.games[idx] = { ...db.games[idx], ...game };
    } else {
      db.games.unshift(game);
    }
    saveDatabase(db);
    res.json(game);
  });

  // DELETE game
  app.delete('/api/games/:id', (req, res) => {
    db.games = db.games.filter((g) => g.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // POST add game result
  app.post('/api/game-results', (req, res) => {
    const result: GameResult = req.body;
    if (!result || !result.gameId || !result.studentName) {
      return res.status(400).json({ error: 'Kết quả trò chơi không hợp lệ' });
    }
    if (!result.id) {
      result.id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    if (!result.completedAt) {
      result.completedAt = new Date().toISOString();
    }

    db.gameResults.unshift(result);

    // Increment play count
    const targetGame = db.games.find((g) => g.id === result.gameId);
    if (targetGame) {
      targetGame.playCount = (targetGame.playCount || 0) + 1;
    }

    findOrCreateStudent(db, result.studentName, result.studentClass);
    recalculateScores(db);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Hoàn thành trò chơi củng cố',
      message: `${result.studentName} – ${result.studentClass} vừa đạt ${result.score}/${result.maxScore} điểm trò chơi “${result.gameTitle}”.`,
      time: 'Vừa xong',
      type: 'game',
      unread: true,
      linkTab: 'results',
      linkId: result.gameId,
    });
    if (db.notifications.length > 50) db.notifications.pop();

    saveDatabase(db);
    res.json(result);
  });

  // POST create or update student
  app.post('/api/students', (req, res) => {
    const student: Student = req.body;
    const idx = db.students.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      db.students[idx] = { ...db.students[idx], ...student };
    } else {
      db.students.push(student);
    }
    recalculateScores(db);
    saveDatabase(db);
    res.json(student);
  });

  // POST create or update class
  app.post('/api/classes', (req, res) => {
    const classroom: Classroom = req.body;
    const idx = db.classes.findIndex((c) => c.id === classroom.id);
    if (idx >= 0) {
      db.classes[idx] = { ...db.classes[idx], ...classroom };
    } else {
      db.classes.push(classroom);
    }
    saveDatabase(db);
    res.json(classroom);
  });

  // POST mark notifications read
  app.post('/api/notifications/read', (req, res) => {
    const { id } = req.body;
    if (id) {
      db.notifications = db.notifications.map((n) =>
        n.id === id ? { ...n, unread: false, read: true } : n
      );
    } else {
      db.notifications = db.notifications.map((n) => ({ ...n, unread: false, read: true }));
    }
    saveDatabase(db);
    res.json({ success: true });
  });

  // POST reset to sample data
  app.post('/api/reset', (_req, res) => {
    db = {
      classes: DEFAULT_CLASSES,
      students: DEFAULT_STUDENTS,
      tasks: DEFAULT_TASKS,
      submissions: DEFAULT_SUBMISSIONS,
      games: DEFAULT_GAMES,
      gameResults: DEFAULT_GAME_RESULTS,
      notifications: DEFAULT_NOTIFICATIONS,
      version: Date.now(),
    };
    recalculateScores(db);
    saveDatabase(db);
    res.json(db);
  });

  // Check if dist folder exists (production build)
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Lớp Học Số server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
