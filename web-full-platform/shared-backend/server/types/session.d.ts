import 'express-session';

declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    user?: {
      _id?: string;
      id?: string;
      email?: string;
      admin?: boolean;
      [key: string]: any;
    };
  }
}
