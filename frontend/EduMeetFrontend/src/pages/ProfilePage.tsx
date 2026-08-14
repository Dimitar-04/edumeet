import axios from 'axios';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { updateProfileImage } from '../api/authApi';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import type { ValidationProblemDetails } from '../types/api/errors';

const maximumProfileImageSizeBytes = 5 * 1024 * 1024;
const acceptedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthLoading, setUser, logout } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  if (isAuthLoading) {
    return (
      <div className="app-shell profile-shell">
        <AppHeader />
        <main className="profile-page section-container" role="status">
          <p>Loading your profile&hellip;</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0] ?? null;

    setUploadError('');
    setUploadMessage('');

    if (!image) {
      setSelectedImage(null);
      setImagePreviewUrl('');
      return;
    }

    if (!acceptedImageTypes.has(image.type)) {
      setUploadError('Choose a JPEG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (image.size > maximumProfileImageSizeBytes) {
      setUploadError('The profile image cannot exceed 5 MB.');
      event.target.value = '';
      return;
    }

    setSelectedImage(image);
    setImagePreviewUrl(URL.createObjectURL(image));
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadMessage('');

      const response = await updateProfileImage({ image: selectedImage });

      setUser({
        ...user,
        imageUrl: response.imageUrl,
      });
      setSelectedImage(null);
      setImagePreviewUrl('');
      setUploadMessage('Your profile photo has been updated.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      let message = 'The profile photo could not be updated.';

      if (axios.isAxiosError<ValidationProblemDetails>(error)) {
        const errors = error.response?.data.errors;
        const firstError = errors
          ? Object.values(errors).flat()[0]
          : undefined;

        message = firstError ?? error.response?.data.title ?? message;
      }

      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

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
        <Link className="breadcrumb profile-back" to="/events">
          &larr; Back to events
        </Link>

        <section className="profile-card" aria-labelledby="profile-title">
          <UserAvatar
            className="profile-avatar-large"
            userName={user.userName}
            imageUrl={imagePreviewUrl || user.imageUrl}
          />

          <div className="profile-image-controls">
            <label className="button button-secondary" htmlFor="profile-image">
              Choose photo
            </label>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />

            {selectedImage ? (
              <button
                className="button button-primary"
                type="button"
                disabled={isUploading}
                onClick={() => void handleImageUpload()}
              >
                {isUploading ? 'Saving...' : 'Save photo'}
              </button>
            ) : null}
          </div>
          <small className="profile-image-help">JPEG, PNG or WebP, up to 5 MB.</small>

          {uploadError ? (
            <p className="publish-error profile-message" role="alert">
              {uploadError}
            </p>
          ) : null}
          {uploadMessage ? (
            <p className="profile-success" role="status">
              {uploadMessage}
            </p>
          ) : null}

          <p className="eyebrow">Your profile</p>
          <h1 id="profile-title">{user.userName}</h1>

          {logoutError ? (
            <p className="publish-error" role="alert">{logoutError}</p>
          ) : null}

          <button
            className="button button-secondary profile-logout"
            type="button"
            disabled={isLoggingOut || isUploading}
            onClick={() => void handleLogout()}
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
