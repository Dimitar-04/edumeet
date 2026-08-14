import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { getCurrentUser, logoutUser } from "../api/authApi";
import type { RegisteredUserResponse } from "../types/user/responses";

interface AuthContextValue {
  user: RegisteredUserResponse | null;
  isAuthLoading: boolean;
  setUser: (user: RegisteredUserResponse | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<RegisteredUserResponse | null>(null);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const restoreUser = async () => {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void restoreUser();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context == null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
