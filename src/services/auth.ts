// Authentication Service for Lớp Học Số - Cô giáo Nguyễn Thị Dung
// Owner credentials:
// Username: nguyendung1347
// Password: Linh123@

export interface AuthUser {
  username: string;
  displayName: string;
  role: 'owner' | 'guest';
  loginAt: string;
}

const AUTH_STORAGE_KEY = 'lop_hoc_so_auth_session';

export const OWNER_CREDENTIALS = {
  username: 'nguyendung1347',
  password: 'Linh123@',
  displayName: 'Cô giáo Nguyễn Thị Dung',
};

class AuthService {
  private user: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.username === OWNER_CREDENTIALS.username && parsed.role === 'owner') {
          this.user = parsed;
          return;
        }
      }
    } catch {
      // Ignored
    }
    this.user = null;
  }

  public subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.user));
  }

  public getCurrentUser(): AuthUser | null {
    return this.user;
  }

  public isOwner(): boolean {
    return this.user !== null && this.user.role === 'owner' && this.user.username === OWNER_CREDENTIALS.username;
  }

  public login(usernameInput: string, passwordInput: string): { success: boolean; message: string } {
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' };
    }

    if (trimmedUser === OWNER_CREDENTIALS.username && trimmedPass === OWNER_CREDENTIALS.password) {
      const newUser: AuthUser = {
        username: OWNER_CREDENTIALS.username,
        displayName: OWNER_CREDENTIALS.displayName,
        role: 'owner',
        loginAt: new Date().toISOString(),
      };
      this.user = newUser;
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } catch (e) {
        console.warn('Storage error:', e);
      }
      this.notify();
      return { success: true, message: 'Đăng nhập thành công với quyền Chủ tài khoản (Cô Dung)!' };
    }

    return { 
      success: false, 
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác! (Chỉ chủ tài khoản mới có quyền quản trị)' 
    };
  }

  public logout(): void {
    this.user = null;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Storage error:', e);
    }
    this.notify();
  }
}

export const authService = new AuthService();
