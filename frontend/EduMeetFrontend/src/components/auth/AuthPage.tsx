import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  getAuthErrorMessage,
  loginUser,
  registerUser,
} from '../../api/authApi';
import type {
  AuthMode,
  LogInFormValues,
  SignUpFormValues,
} from '../../types/user/auth';
import { toRegisterRequest } from '../../types/user/registration';
import LogIn from './LogIn';
import SignUp from './SignUp';
import { useAuth } from '../../contexts/AuthContext';

function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
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

      navigate('/home', {
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
      console.log(user);
      navigate('/home', {
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
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-8 font-sans text-slate-900">
      {authMode === 'login' ? (
        <LogIn
          onSubmit={handleLogin}
          onSwitchMode={() => switchMode('signup')}
          isSubmitting={isSubmitting}
          submitError={authError}
        />
      ) : (
        <SignUp
          onSubmit={handleRegister}
          onSwitchMode={() => switchMode('login')}
          isSubmitting={isSubmitting}
          submitError={authError}
        />
      )}
    </main>
  );
}

export default AuthPage;
