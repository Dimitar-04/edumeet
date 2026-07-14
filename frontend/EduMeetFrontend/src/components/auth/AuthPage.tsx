import { useState } from 'react';
import type { AuthMode } from '../../types/user/auth';
import LogIn from './LogIn';
import SignUp from './SignUp';

function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-8 font-sans text-slate-900">
      {authMode === 'login' ? (
        <LogIn onSwitchMode={() => setAuthMode('signup')} />
      ) : (
        <SignUp onSwitchMode={() => setAuthMode('login')} />
      )}
    </main>
  );
}

export default AuthPage;
