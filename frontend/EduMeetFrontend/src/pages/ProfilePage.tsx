import axios from 'axios';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { getPublicProfile, updateProfileImage } from '../api/profileApi';
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
  const [profile, setProfile] = useState<PublicUserProfileResponse | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
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

  useEffect(() => {
    if (isAuthLoading || !requestedUserId) {
      if (!isAuthLoading) setIsProfileLoading(false);
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

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = Date.now();
    const events = profile?.organizedEvents ?? [];

    return {
      upcomingEvents: events
        .filter((event) => new Date(event.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      pastEvents: events
        .filter((event) => new Date(event.date).getTime() < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [profile]);

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

  if (!userId && !user) return <Navigate to="/login" replace />;

  if (!profile) {
    return (
      <div className="app-shell profile-shell">
        <AppHeader />
        <main className="profile-page section-container">
          <Link className="breadcrumb profile-back" to="/events">&larr; Back to events</Link>
          <div className="empty-state profile-empty" role="alert">
            <h1>Profile unavailable</h1>
            <p>{profileError}</p>
          </div>
        </main>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const accountLabel = profile.accountType === AccountType.Organization
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
      setProfile((current) => current ? { ...current, imageUrl: response.imageUrl } : current);
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
        <Link className="breadcrumb profile-back" to="/events">&larr; Back to events</Link>

        <section className="public-profile-hero" aria-labelledby="profile-title">
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
                <a className="profile-website" href={profile.organization.website} target="_blank" rel="noreferrer">
                  Visit website
                </a>
              ) : null}
            </div>
          </div>

          <dl className="profile-stats">
            <div><dt>{profile.organizedEvents.length}</dt><dd>Events organized</dd></div>
            <div><dt>{upcomingEvents.length}</dt><dd>Upcoming events</dd></div>
            <div>
              <dt>{pastEvents.reduce((sum, event) => sum + event.ratingCount, 0)}</dt>
              <dd>Ratings received</dd>
            </div>
          </dl>

          {isOwnProfile ? (
            <div className="profile-owner-controls">
              <div className="profile-image-controls">
                <label className="button button-secondary" htmlFor="profile-image">Choose photo</label>
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  id="profile-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
                {selectedImage ? (
                  <button className="button button-primary" type="button" disabled={isUploading} onClick={() => void handleImageUpload()}>
                    {isUploading ? 'Saving...' : 'Save photo'}
                  </button>
                ) : null}
              </div>
              <small className="profile-image-help">JPEG, PNG or WebP, up to 5 MB.</small>
              {uploadError ? <p className="publish-error profile-message" role="alert">{uploadError}</p> : null}
              {uploadMessage ? <p className="profile-success" role="status">{uploadMessage}</p> : null}
            </div>
          ) : null}
        </section>

        <section className="profile-events-section" aria-labelledby="upcoming-title">
          <div className="profile-section-heading">
            <div><p className="eyebrow">Next up</p><h2 id="upcoming-title">Upcoming events</h2></div>
            <span>{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.length ? (
            <div className="profile-event-grid">
              {upcomingEvents.map((event) => <ProfileEventCard key={event.id} event={event} showRating={false} />)}
            </div>
          ) : <p className="profile-events-empty">No upcoming events yet.</p>}
        </section>

        <section className="profile-events-section" aria-labelledby="past-title">
          <div className="profile-section-heading">
            <div><p className="eyebrow">Archive</p><h2 id="past-title">Past events and ratings</h2></div>
            <span>{pastEvents.length}</span>
          </div>
          {pastEvents.length ? (
            <div className="profile-event-grid">
              {pastEvents.map((event) => <ProfileEventCard key={event.id} event={event} showRating />)}
            </div>
          ) : <p className="profile-events-empty">No past events yet.</p>}
        </section>

        {isOwnProfile ? (
          <section className="profile-account-actions">
            <div><strong>Account session</strong><p>Sign out of EduMeet on this device.</p></div>
            <button className="button button-secondary profile-logout" type="button" disabled={isLoggingOut || isUploading} onClick={() => void handleLogout()}>
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
            {logoutError ? <p className="publish-error" role="alert">{logoutError}</p> : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default ProfilePage;
