import { useState } from 'react';
import LogIn from './components/auth/LogIn';
import SignUp from './components/auth/SignUp';
import type { AuthMode } from './types/user/auth';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  return (
    <main>
      {authMode === 'login' ? (
        <LogIn onSwitchMode={() => setAuthMode('signup')} />
      ) : (
        <SignUp onSwitchMode={() => setAuthMode('login')} />
      )}
    </main>
  );
}

export default App;
