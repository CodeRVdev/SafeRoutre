export interface UserPayload {
  user_id: number;
  role: 'admin' | 'coordinator' | 'student' | 'faculty' | 'staff' | string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
