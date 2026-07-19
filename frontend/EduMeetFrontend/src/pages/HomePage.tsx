import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <p>Loading...</p>;
  }

  return <h1>Hello {user ? user.userName : 'Guest'}!</h1>;
}

export default HomePage;
