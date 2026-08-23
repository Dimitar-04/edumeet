import AuthPage from './components/auth/AuthPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailsPage from './pages/EventDetailsPage';
import EventAttendancePage from './pages/EventAttendancePage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import MySchedulePage from './pages/MySchedulePage';
import ProfilePage from './pages/ProfilePage';
import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/home',
    element: <Navigate to="/events" replace />,
  },
  {
    path: '/events',
    element: <HomePage />,
  },
  {
    path: '/events/create',
    element: <CreateEventPage />,
  },
  {
    path: '/my-events',
    element: <MySchedulePage />,
  },
  {
    path: '/events/:eventId/attendance',
    element: <EventAttendancePage />,
  },
  {
    path: '/events/:eventId',
    element: <EventDetailsPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/profile/:userId',
    element: <ProfilePage />,
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
