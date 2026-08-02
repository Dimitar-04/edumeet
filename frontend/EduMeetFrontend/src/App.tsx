import AuthPage from './components/auth/AuthPage';
import CreateEventPage from './pages/CreateEventPage';
import HomePage from './pages/HomePage';
import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/events/create',
    element: <CreateEventPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
