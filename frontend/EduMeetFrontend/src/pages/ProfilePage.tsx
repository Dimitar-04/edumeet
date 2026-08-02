import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  if (isAuthLoading) {
    return (
      <div className="app-shell profile-shell">
        <AppHeader />
        <main className="profile-page section-container" role="status">
          <p>Loading your profile…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError('');
      await logout();
      navigate('/', { replace: true });
    } catch {
      setLogoutError('Could not log you out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="app-shell profile-shell">
      <AppHeader />

      <main className="profile-page section-container">
        <Link className="breadcrumb profile-back" to="/">
          ← Back to events
        </Link>

        <section className="profile-card" aria-labelledby="profile-title">
          <UserAvatar
            className="profile-avatar-large"
            userName={user.userName}
            imageUrl={user.imageUrl}
          />
          <p className="eyebrow">Your profile</p>
          <h1 id="profile-title">{user.userName}</h1>

          {logoutError ? (
            <p className="publish-error" role="alert">{logoutError}</p>
          ) : null}

          <button
            className="button button-secondary profile-logout"
            type="button"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
