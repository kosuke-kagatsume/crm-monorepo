'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  companyId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: null,
  login: async () => {},
  logout: () => {},
  loading: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックユーザーを設定（開発用）
    setUser({
      id: 'user_1',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'foreman',
    });
    setCompanyId('test_company_123');
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // ログイン処理のモック
    setUser({
      id: 'user_1',
      name: 'テストユーザー',
      email: email,
      role: 'foreman',
    });
    setCompanyId('test_company_123');
  };

  const logout = () => {
    setUser(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, companyId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}