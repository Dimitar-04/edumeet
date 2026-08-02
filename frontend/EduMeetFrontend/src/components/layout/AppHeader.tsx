import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../user/UserAvatar';

function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!user) return;

    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      // The visual prototype keeps the current page in place on API failure.
    }
  };

  return (
    <header className="site-header">
      <div className="section-container header-inner">
        <Link className="brand" to="/" aria-label="EduMeet home">
          <span className="brand-logo-crop" aria-hidden="true">
            <img src="/edumeet-logo.png" alt="" />
          </span>
          <span className="brand-wordmark">EduMeet</span>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          <NavLink to="/" end>Home</NavLink>
          <a href="/#discover">Explore</a>
          <span className="nav-disabled" title="Coming soon">Organizations</span>
        </nav>

        <div className="header-actions">
          <Link className="button button-primary header-create" to="/events/create">
            Create event
          </Link>

          {user ? (
            <button
              className="profile-button"
              type="button"
              onClick={handleLogout}
              title="Log out"
            >
              <UserAvatar
                className="header-avatar"
                userName={user.userName}
                imageUrl={user.imageUrl}
              />
              <span className="profile-copy">
                <strong>{user.userName}</strong>
                <small>Log out</small>
              </span>
            </button>
          ) : (
            <Link className="profile-button guest-profile" to="/login">
              <UserAvatar
                className="header-avatar"
                userName="Guest"
                imageUrl={null}
              />
              <span className="profile-copy">
                <strong>Guest</strong>
                <small>Log in</small>
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
