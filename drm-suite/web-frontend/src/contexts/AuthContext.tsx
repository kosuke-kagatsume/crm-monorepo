'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * ユーザー情報の型定義
 */
interface User {
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean; // スーパー管理者フラグ
  isAdmin?: boolean; // 一般管理者フラグ
  tenantId?: string; // テナントID
}

/**
 * 認証コンテキストの型定義
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string, role: string) => void;
  logout: () => void;
  isSuperAdmin: () => boolean; // スーパー管理者判定
  isAdmin: () => boolean; // 管理者判定（スーパー or 一般）
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isSuperAdmin: () => false,
  isAdmin: () => false,
});

/**
 * 認証情報を取得するカスタムフック
 * @returns {AuthContextType} 認証コンテキスト
 * @throws {Error} AuthProvider外で使用された場合
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// 認証不要なパス
const publicPaths = ['/login', '/', '/api'];

/**
 * 認証プロバイダーコンポーネント
 * アプリケーション全体の認証状態を管理
 * @param {React.ReactNode} children - 子コンポーネント
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 認証チェック
    const checkAuth = () => {
      try {
        const email = localStorage.getItem('userEmail');
        const name = localStorage.getItem('userName');
        const role = localStorage.getItem('userRole');
        const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const tenantId = localStorage.getItem('tenantId');

        if (email && role) {
          setUser({
            email,
            name: name || '',
            role,
            isSuperAdmin,
            isAdmin,
            tenantId: tenantId || undefined,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [mounted]);

  useEffect(() => {
    if (!mounted || isLoading) return;

    // パスが公開パスでない場合、未ログインならログインページへ
    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname.startsWith('/api'),
    );

    if (!isPublicPath && !user) {
      router.push('/login');
    }
  }, [pathname, user, isLoading, mounted, router]);

  const login = (email: string, name: string, role: string) => {
    // スーパー管理者の判定（デモ用：特定のメールアドレス）
    const isSuperAdmin = email === 'super@demo.com';
    const isAdmin = email === 'admin@demo.com' || isSuperAdmin;
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'; // デモ用テナントID

    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    localStorage.setItem('isSuperAdmin', isSuperAdmin.toString());
    localStorage.setItem('isAdmin', isAdmin.toString());
    localStorage.setItem('tenantId', tenantId);

    setUser({ email, name, role, isSuperAdmin, isAdmin, tenantId });
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isSuperAdmin');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('tenantId');
    setUser(null);
    router.push('/login');
  };

  // 管理者判定関数
  const isSuperAdmin = () => user?.isSuperAdmin === true;
  const isAdmin = () => user?.isAdmin === true || user?.isSuperAdmin === true;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isSuperAdmin, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}
