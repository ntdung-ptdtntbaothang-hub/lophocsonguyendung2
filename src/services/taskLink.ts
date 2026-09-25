import { Task, Game } from '../types';

/**
 * UTF-8 Base64URL encoder that works across all modern browsers and Node.js
 */
export function encodeUtf8Base64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Error in encodeUtf8Base64:', err);
    return '';
  }
}

/**
 * UTF-8 Base64URL decoder that works across all modern browsers and Node.js
 */
export function decodeUtf8Base64(b64url: string): string {
  try {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (err) {
    console.error('Error in decodeUtf8Base64:', err);
    return '';
  }
}

/**
 * Compact representation of a Task for URL transmission
 */
interface CompactTaskPayload {
  id: string;
  t: string;          // title
  s?: string;         // subject
  g?: string;         // grade
  c?: string[];       // classIds
  lt?: string;        // lessonTopic
  ob?: string;        // objective
  r?: string;         // requirements
  i?: string;         // instructions
  sd?: string;        // startDate
  ed?: string;        // endDate / deadline
  f?: string[];       // allowedFileTypes
  n?: string;         // teacherNote
  ca?: string;        // createdAt
}

/**
 * Encode task into compact URL parameter
 */
export function encodeTaskForUrl(task: Task): string {
  const compact: CompactTaskPayload = {
    id: task.id,
    t: task.title,
    s: task.subject,
    g: task.grade,
    c: task.classIds,
    lt: task.lessonTopic || undefined,
    ob: task.objective || undefined,
    r: task.requirements,
    i: task.instructions || undefined,
    sd: task.startDate,
    ed: task.endDate || task.deadline,
    f: task.allowedFileTypes,
    n: task.teacherNote || undefined,
    ca: task.createdAt,
  };

  return encodeUtf8Base64(JSON.stringify(compact));
}

/**
 * Decode task from URL parameter
 */
export function decodeTaskFromUrl(encoded: string): Task | null {
  if (!encoded) return null;
  try {
    const jsonStr = decodeUtf8Base64(encoded);
    if (!jsonStr) return null;
    const compact: CompactTaskPayload = JSON.parse(jsonStr);
    if (!compact || !compact.id || !compact.t) return null;

    const task: Task = {
      id: compact.id,
      title: compact.t,
      subject: compact.s || 'Tin học',
      grade: compact.g || 'Khối 10',
      classIds: compact.c || ['10A'],
      lessonTopic: compact.lt || '',
      objective: compact.ob || '',
      requirements: compact.r || '',
      instructions: compact.i || '',
      startDate: compact.sd,
      endDate: compact.ed,
      deadline: compact.ed || '2026-10-30T23:59',
      allowedFileTypes: (compact.f as any) || ['word', 'pdf', 'image'],
      teacherNote: compact.n || '',
      createdAt: compact.ca || new Date().toISOString(),
      status: 'active',
    };

    return task;
  } catch (err) {
    console.warn('Failed to parse task payload from URL:', err);
    return null;
  }
}

/**
 * Generates an absolute, bulletproof URL for a Task that:
 * 1. Points to mode=student&taskId=...
 * 2. Encodes the task payload (&tdata=...) so any student opening the link
 *    has the complete task immediately without depending on prior sync.
 */
export function generateTaskDirectUrl(taskId: string, task?: Task | null): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const cleanBase = `${origin}${pathname}`;

  let url = `${cleanBase}?mode=student&taskId=${encodeURIComponent(taskId)}`;
  if (task && task.id === taskId) {
    const encodedData = encodeTaskForUrl(task);
    if (encodedData) {
      url += `&tdata=${encodedData}`;
    }
  }
  return url;
}

/**
 * Generates an absolute URL for a Game
 */
export function generateGameDirectUrl(gameId: string, _game?: Game | null): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const cleanBase = `${origin}${pathname}`;

  return `${cleanBase}?mode=game&gameId=${encodeURIComponent(gameId)}`;
}
