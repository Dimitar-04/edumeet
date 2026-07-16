import { Navigate, useLocation } from 'react-router';

interface HomeLocationState {
  userName?: string;
}

function HomePage() {
  const location = useLocation();
  const { userName } = (location.state as HomeLocationState | null) ?? {};

  if (!userName) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 font-sans text-slate-900">
      <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        Hello {userName}!
      </h1>
    </main>
  );
}

export default HomePage;
