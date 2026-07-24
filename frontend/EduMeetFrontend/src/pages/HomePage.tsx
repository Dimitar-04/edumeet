import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/user/UserAvatar';

function HomePage() {
  const { user, isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
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
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-10 text-slate-900">
      <section className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-xl shadow-slate-900/10">
        <UserAvatar
          className="h-24 w-24"
          userName={user.userName}
          imageUrl={user.imageUrl}
        />

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Welcome to EduMeet
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Hello {user.userName}!
        </h1>

        <button
          className="mt-8 cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </section>
    </main>
  );
}

export default HomePage;
