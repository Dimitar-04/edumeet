import axios from 'axios';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import {
  getPublicProfile,
  updateProfileImage,
  updateUsername,
} from '../api/profileApi';
import ProfileEventCard from '../components/events/ProfileEventCard';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import type { ValidationProblemDetails } from '../types/api/errors';
import { AccountType } from '../types/user/auth';
import type { PublicUserProfileResponse } from '../types/user/responses';

const maximumProfileImageSizeBytes = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthLoading, setUser, logout } = useAuth();
  const requestedUserId = userId ?? user?.id;
  const [profile, setProfile] = useState<PublicUserProfileResponse | null>(
    null,
  );
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [usernameValue, setUsernameValue] = useState(user?.userName ?? '');
  const [isUsernameSaving, setIsUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [profileViewedAt] = useState(Date.now);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (isAuthLoading || !requestedUserId) {
      return;
    }

    let isCurrent = true;
    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);
        setProfileError('');
        const response = await getPublicProfile(requestedUserId);
        if (!isCurrent) return;

        if (!response) {
          setProfile(null);
          setProfileError('This profile could not be found.');
          return;
        }

        setProfile(response);
        setUsernameValue(response.userName);
      } catch {
        if (isCurrent) {
          setProfile(null);
          setProfileError('The profile could not be loaded.');
        }
      } finally {
        if (isCurrent) setIsProfileLoading(false);
      }
    };

    void loadProfile();
    return () => {
      isCurrent = false;
    };
  }, [isAuthLoading, requestedUserId]);

  const { upcomingHostedEvents, pastHostedEvents } = useMemo(() => {
    const events = profile?.organizedEvents ?? [];

    return {
      upcomingHostedEvents: events
        .filter((event) => new Date(event.date).getTime() >= profileViewedAt)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      pastHostedEvents: events
        .filter((event) => new Date(event.date).getTime() < profileViewedAt)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    };
  }, [profile, profileViewedAt]);

  if (!isAuthLoading && !userId && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="app-shell profile-shell">
        <AppHeader />
        <main className="profile-page section-container" role="status">
          <p>Loading profile&hellip;</p>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-shell profile-shell">
        <AppHeader />
        <main className="profile-page section-container">
          <Link className="breadcrumb profile-back" to="/events">
            &larr; Back to events
          </Link>
          <div className="empty-state profile-empty" role="alert">
            <h1>Profile unavailable</h1>
            <p>{profileError}</p>
          </div>
        </main>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const accountLabel =
    profile.accountType === AccountType.Organization
      ? 'Organization'
      : 'Individual';

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
    if (!selectedImage || !user || !isOwnProfile) return;
    try {
      setIsUploading(true);
      setUploadError('');
      setUploadMessage('');
      const response = await updateProfileImage({ image: selectedImage });

      setUser({ ...user, imageUrl: response.imageUrl });
      setProfile((current) =>
        current ? { ...current, imageUrl: response.imageUrl } : current,
      );
      setSelectedImage(null);
      setImagePreviewUrl('');
      setUploadMessage('Your profile photo has been updated.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      let message = 'The profile photo could not be updated.';
      if (axios.isAxiosError<ValidationProblemDetails>(error)) {
        const errors = error.response?.data.errors;
        const firstError = errors ? Object.values(errors).flat()[0] : undefined;
        message = firstError ?? error.response?.data.title ?? message;
      }
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUsernameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !isOwnProfile) return;

    const nextUsername = usernameValue.trim();

    if (nextUsername.length < 3) {
      setUsernameError('Username must contain at least 3 characters.');
      setUsernameMessage('');
      return;
    }

    try {
      setIsUsernameSaving(true);
      setUsernameError('');
      setUsernameMessage('');

      const updatedUser = await updateUsername({
        userName: nextUsername,
      });

      setUser(updatedUser);
      setProfile((current) =>
        current ? { ...current, userName: updatedUser.userName } : current,
      );
      setUsernameValue(updatedUser.userName);
      setUsernameMessage('Your username has been updated.');
    } catch (error) {
      let message = 'The username could not be updated.';

      if (axios.isAxiosError<ValidationProblemDetails>(error)) {
        const errors = error.response?.data.errors;
        const firstError = errors ? Object.values(errors).flat()[0] : undefined;

        message = firstError ?? error.response?.data.title ?? message;
      }

      setUsernameError(message);
    } finally {
      setIsUsernameSaving(false);
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

        <section
          className="public-profile-hero"
          aria-labelledby="profile-title"
        >
          <div className="public-profile-identity">
            <UserAvatar
              className="profile-avatar-large"
              userName={profile.displayName}
              imageUrl={imagePreviewUrl || profile.imageUrl}
            />
            <div>
              <p className="eyebrow">{accountLabel} profile</p>
              <h1 id="profile-title">{profile.displayName}</h1>
              <p className="profile-username">@{profile.userName}</p>
              {profile.organization?.website ? (
                <a
                  className="profile-website"
                  href={profile.organization.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit website
                </a>
              ) : null}
            </div>
          </div>

          <dl className="profile-stats">
            <div>
              <dt>{profile.organizedEvents.length}</dt>
              <dd>Events created</dd>
            </div>
            <div>
              <dt>{upcomingHostedEvents.length}</dt>
              <dd>Upcoming hosted</dd>
            </div>
            <div>
              <dt>
                {pastHostedEvents.reduce(
                  (sum, event) => sum + event.ratingCount,
                  0,
                )}
              </dt>
              <dd>Ratings received</dd>
            </div>
          </dl>

          {isOwnProfile ? (
            <div className="profile-owner-controls">
              <div className="profile-settings-grid">
                <form
                  className="profile-username-form"
                  onSubmit={(event) => void handleUsernameSubmit(event)}
                >
                  <div className="profile-setting-heading">
                    <strong>Username</strong>
                    <small>
                      This is used when signing in and identifying your account.
                    </small>
                  </div>
                  <div className="profile-username-input-row">
                    <label
                      className="visually-hidden"
                      htmlFor="profile-username"
                    >
                      Username
                    </label>
                    <input
                      id="profile-username"
                      name="userName"
                      type="text"
                      minLength={3}
                      maxLength={256}
                      autoComplete="username"
                      value={usernameValue}
                      disabled={isUsernameSaving}
                      onChange={(event) => {
                        setUsernameValue(event.target.value);
                        setUsernameError('');
                        setUsernameMessage('');
                      }}
                    />
                    <button
                      className="button button-primary"
                      type="submit"
                      disabled={
                        isUsernameSaving ||
                        usernameValue.trim() === user.userName
                      }
                    >
                      {isUsernameSaving ? 'Saving...' : 'Save username'}
                    </button>
                  </div>
                  {usernameError ? (
                    <p className="publish-error profile-message" role="alert">
                      {usernameError}
                    </p>
                  ) : null}
                  {usernameMessage ? (
                    <p className="profile-success" role="status">
                      {usernameMessage}
                    </p>
                  ) : null}
                </form>

                <div className="profile-photo-setting">
                  <div className="profile-setting-heading">
                    <strong>Profile photo</strong>
                    <small>JPEG, PNG or WebP, up to 5 MB.</small>
                  </div>
                  <div className="profile-image-controls">
                    <label
                      className="button button-secondary"
                      htmlFor="profile-image"
                    >
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
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section
          className="profile-events-section"
          aria-labelledby="upcoming-title"
        >
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">
                {isOwnProfile
                  ? 'Created by you'
                  : `Created by ${profile.displayName}`}
              </p>
              <h2 id="upcoming-title">Upcoming Events</h2>
            </div>
            <span>{upcomingHostedEvents.length}</span>
          </div>
          {upcomingHostedEvents.length ? (
            <div className="profile-event-grid">
              {upcomingHostedEvents.map((event) => (
                <ProfileEventCard
                  key={event.id}
                  event={event}
                  showRating={false}
                  relationship="hosted"
                />
              ))}
            </div>
          ) : (
            <p className="profile-events-empty">
              No upcoming hosted events yet.
            </p>
          )}
        </section>

        <section
          className="profile-events-section"
          aria-labelledby="past-title"
        >
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">
                {isOwnProfile ? 'Your hosting archive' : ''}
              </p>
              <h2 id="past-title">Past Events</h2>
            </div>
            <span>{pastHostedEvents.length}</span>
          </div>
          {pastHostedEvents.length ? (
            <div className="profile-event-grid">
              {pastHostedEvents.map((event) => (
                <ProfileEventCard
                  key={event.id}
                  event={event}
                  showRating
                  relationship="hosted"
                />
              ))}
            </div>
          ) : (
            <p className="profile-events-empty">No past hosted events yet.</p>
          )}
        </section>

        {isOwnProfile ? (
          <section className="profile-account-actions">
            <div>
              <strong>Account session</strong>
              <p>Sign out of EduMeet on this device.</p>
            </div>
            <button
              className="button button-secondary profile-logout"
              type="button"
              disabled={isLoggingOut || isUploading}
              onClick={() => void handleLogout()}
            >
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
            {logoutError ? (
              <p className="publish-error" role="alert">
                {logoutError}
              </p>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default ProfilePage;
