import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  getAuthErrorMessage,
  loginUser,
  registerUser,
} from "../../api/authApi";
import type {
  AuthMode,
  LogInFormValues,
  SignUpFormValues,
} from "../../types/user/auth";
import { toRegisterRequest } from "../../types/user/requests";
import LogIn from "./LogIn";
import SignUp from "./SignUp";
import { useAuth } from "../../contexts/AuthContext";

function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const { setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const user = await registerUser(toRegisterRequest(values));

      setUser(user);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (values: LogInFormValues) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const user = await loginUser({
        login: values.emailOrUserName.trim(),
        password: values.password,
      });

      setUser(user);
      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthError(null);
    setAuthMode(mode);
  };

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link className="brand" to="/" aria-label="EduMeet home">
          <span className="brand-logo-crop" aria-hidden="true">
            <img src="/edumeet-logo.png" alt="" />
          </span>
          <span className="brand-wordmark">EduMeet</span>
        </Link>
        <Link className="auth-home-link" to="/">
          Back to events
        </Link>
      </header>

      <div className="auth-layout">
        <div className="auth-form-shell">
          {authMode === "login" ? (
            <LogIn
              onSubmit={handleLogin}
              onSwitchMode={() => switchMode("signup")}
              isSubmitting={isSubmitting}
              submitError={authError}
            />
          ) : (
            <SignUp
              onSubmit={handleRegister}
              onSwitchMode={() => switchMode("login")}
              isSubmitting={isSubmitting}
              submitError={authError}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
