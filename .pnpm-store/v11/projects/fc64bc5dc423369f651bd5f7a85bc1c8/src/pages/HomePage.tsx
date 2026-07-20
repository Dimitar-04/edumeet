import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return <p>Loading...</p>;
  }

  const handleLogout = async () => {
    try {
      await logout();

      navigate('/', {
        replace: true,
      });
    } catch {
      console.error('Logout failed');
    }
  };

  return (
    <>
      <h1>Hello {user ? user.userName : 'Guest'}!</h1>

      <button onClick={handleLogout}>Logout</button>
    </>
  );
}

export default HomePage;
