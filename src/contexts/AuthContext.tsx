import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import type { UseAuthReturn } from '../hooks/useAuth.ts';

// Create the authentication context
const AuthContext = createContext<UseAuthReturn | null>(null);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication context provider component
 * Wraps the application and provides authentication state and methods
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authValue = useAuth();

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider
 */
export const useAuthContext = (): UseAuthReturn => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
