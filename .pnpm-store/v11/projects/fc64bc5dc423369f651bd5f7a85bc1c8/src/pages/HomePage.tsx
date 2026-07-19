import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../api/authApi';

function HomePage() {
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return <p>Loading...</p>;
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
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
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        onClick={handleLogout}
      >
        Logout
      </button>
    </>
  );
}

export default HomePage;
