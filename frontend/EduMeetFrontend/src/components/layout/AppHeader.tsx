import { Link, NavLink } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../user/UserAvatar';

function AppHeader() {
  const { user } = useAuth();

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
            <Link
              className="profile-button"
              to="/profile"
              aria-label={`Open ${user.userName}'s profile`}
            >
              <UserAvatar
                className="header-avatar"
                userName={user.userName}
                imageUrl={user.imageUrl}
              />
              <span className="profile-copy">
                <strong>{user.userName}</strong>
              </span>
            </Link>
          ) : (
            <div className="guest-account">
              <div className="profile-button guest-identity">
                <UserAvatar
                  className="header-avatar"
                  userName="Guest"
                  imageUrl={null}
                />
                <span className="profile-copy">
                  <strong>Guest</strong>
                </span>
              </div>
              <Link className="button button-secondary header-login" to="/login">
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
