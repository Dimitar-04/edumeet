import { useState } from 'react';
import { useNavigate } from 'react-router';
import { getAuthErrorMessage, registerUser } from '../../api/authApi';
import type { AuthMode, SignUpFormValues } from '../../types/user/auth';
import { toRegisterRequest } from '../../types/user/registration';
import LogIn from './LogIn';
import SignUp from './SignUp';

function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (values: SignUpFormValues) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const user = await registerUser(toRegisterRequest(values));

      navigate('/home', {
        replace: true,
        state: { userName: user.userName },
      });
    } catch (error) {
      setRegistrationError(getAuthErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setRegistrationError(null);
    setAuthMode(mode);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-8 font-sans text-slate-900">
      {authMode === 'login' ? (
        <LogIn onSwitchMode={() => switchMode('signup')} />
      ) : (
        <SignUp
          onSubmit={handleRegister}
          onSwitchMode={() => switchMode('login')}
          isSubmitting={isRegistering}
          submitError={registrationError}
        />
      )}
    </main>
  );
}

export default AuthPage;
