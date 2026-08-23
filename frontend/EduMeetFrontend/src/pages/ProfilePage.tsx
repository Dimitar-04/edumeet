import axios from 'axios';
import {
  useEffect,
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
import { getOrganizedEvents } from '../api/eventsApi';
import EventCategoryTabs from '../components/events/EventCategoryTabs';
import EventCard from '../components/events/EventCard';
import Pagination from '../components/common/Pagination';
import AppHeader from '../components/layout/AppHeader';
import UserAvatar from '../components/user/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import type { ValidationProblemDetails } from '../types/api/errors';
import type { PagedResponse } from '../types/api/pagination';
import type { EventCategory } from '../types/event/common';
import type { EventTimeScope } from '../types/event/requests';
import type { EducationalEventResponse } from '../types/event/responses';
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
  const [organizedEventPage, setOrganizedEventPage] = useState<
    PagedResponse<EducationalEventResponse>
  >({
    items: [],
    pageNumber: 1,
    pageSize: 6,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [areEventsLoading, setAreEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'All'>(
    'All',
  );
  const [eventScope, setEventScope] = useState<EventTimeScope>('Upcoming');
  const [eventPageNumber, setEventPageNumber] = useState(1);

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
        setEventPageNumber(1);
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

  useEffect(() => {
    if (!profile) return;

    let isCurrentRequest = true;

    const loadOrganizedEvents = async () => {
      try {
        setAreEventsLoading(true);
        setEventsError('');

        const loadedEvents = await getOrganizedEvents(profile.id, {
          scope: eventScope,
          category: activeCategory === 'All' ? undefined : activeCategory,
          pageNumber: eventPageNumber,
          pageSize: 6,
        });

        if (isCurrentRequest) {
          setOrganizedEventPage(loadedEvents);
        }
      } catch {
        if (isCurrentRequest) {
          setEventsError(
            'The events created by this profile could not be loaded.',
          );
        }
      } finally {
        if (isCurrentRequest) {
          setAreEventsLoading(false);
        }
      }
    };

    void loadOrganizedEvents();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeCategory, eventPageNumber, eventScope, profile]);

  const organizedEvents = organizedEventPage.items;

  const handleProfileCategoryChange = (
    category: EventCategory | 'All',
  ) => {
    setActiveCategory(category);
    setEventPageNumber(1);
  };

  const handleProfileEventScopeChange = (scope: EventTimeScope) => {
    setEventScope(scope);
    setEventPageNumber(1);
  };

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
              <h2 id="profile-title">{profile.displayName}</h2>
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

          <dl
            className={`profile-stats ${
              profile.accountType === AccountType.Individual
                ? 'profile-stats-individual'
                : ''
            }`}
          >
            {profile.accountType === AccountType.Organization ? (
              <>
                <div>
                  <dt>{profile.statistics.hostedEventsCount}</dt>
                  <dd>Hosted events</dd>
                </div>
                <div>
                  <dt>{profile.statistics.averageRating?.toFixed(1) ?? '—'}</dt>
                  <dd>Average rating</dd>
                </div>
                <div>
                  <dt>{profile.statistics.reviewCount}</dt>
                  <dd>Reviews received</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt>{profile.statistics.attendedEventsCount}</dt>
                  <dd>Events attended</dd>
                </div>
                <div>
                  <dt>{profile.statistics.hostedEventsCount}</dt>
                  <dd>Created events</dd>
                </div>

                {profile.statistics.hostedEventsCount > 0 && (
                  <div>
                    <dt>
                      {profile.statistics.averageRating?.toFixed(1) ?? '—'}
                    </dt>
                    <dd>Average rating</dd>
                  </div>
                )}
                <div>
                  <dt className="profile-stat-category">
                    {profile.statistics.favoriteCategory ?? '—'}
                  </dt>
                  <dd>Favourite category</dd>
                </div>
              </>
            )}
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
          className="profile-events-browser"
          aria-labelledby="profile-events-title"
        >
          <div className="section-heading profile-events-browser-heading">
            <div>
              <p className="eyebrow">
                {isOwnProfile ? 'Your work' : 'Event portfolio'}
              </p>
              <h2 id="profile-events-title">Hosted events</h2>
            </div>
            <span>{profile.statistics.hostedEventsCount}</span>
          </div>

          <div className="profile-event-controls">
            <EventCategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={handleProfileCategoryChange}
              className="profile-event-category-tabs"
              ariaLabel="Filter hosted events by category"
            />
            <div
              className="profile-event-scope"
              aria-label="Choose which hosted events to show"
            >
              <button
                className={eventScope === 'Upcoming' ? 'active' : ''}
                type="button"
                aria-pressed={eventScope === 'Upcoming'}
                onClick={() => handleProfileEventScopeChange('Upcoming')}
              >
                Upcoming
              </button>
              <button
                className={eventScope === 'Past' ? 'active' : ''}
                type="button"
                aria-pressed={eventScope === 'Past'}
                onClick={() => handleProfileEventScopeChange('Past')}
              >
                Past
              </button>
            </div>
          </div>

          {areEventsLoading ? (
            <div className="empty-state" role="status">
              <h3>Gathering hosted events&hellip;</h3>
              <p>The profile&apos;s event list is almost ready.</p>
            </div>
          ) : eventsError ? (
            <div className="empty-state" role="alert">
              <h3>Hosted events unavailable</h3>
              <p>{eventsError}</p>
            </div>
          ) : organizedEvents.length > 0 ? (
            <>
              <div className="event-feed">
              {eventScope === 'Upcoming' ? (
                <section
                  className="event-feed-group profile-event-feed-group"
                  aria-labelledby="profile-upcoming-events-title"
                >
                  <div className="event-feed-heading">
                    <div>
                      <p className="eyebrow">Coming up</p>
                      <h3 id="profile-upcoming-events-title">
                        Upcoming events
                      </h3>
                    </div>
                    <span>{organizedEventPage.totalCount}</span>
                  </div>
                  <div className="event-grid">
                    {organizedEvents.map((event) => (
                      <EventCard event={event} key={event.id} />
                    ))}
                  </div>
                </section>
              ) : null}

              {eventScope === 'Past' ? (
                <section
                  className="event-feed-group profile-event-feed-group profile-event-archive"
                  aria-labelledby="profile-past-events-title"
                >
                  <div className="event-feed-heading">
                    <div>
                      <p className="eyebrow">From the archive</p>
                      <h3 id="profile-past-events-title">Past events</h3>
                    </div>
                    <span>{organizedEventPage.totalCount}</span>
                  </div>
                  <div className="event-grid">
                    {organizedEvents.map((event) => (
                      <EventCard event={event} key={event.id} />
                    ))}
                  </div>
                </section>
              ) : null}
              </div>
              <div className="event-pagination-footer">
                <p>
                  Page {organizedEventPage.pageNumber} of{' '}
                  {organizedEventPage.totalPages}
                </p>
                <Pagination
                  pageNumber={organizedEventPage.pageNumber}
                  totalPages={organizedEventPage.totalPages}
                  onPageChange={setEventPageNumber}
                />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>
                {activeCategory !== 'All'
                  ? 'No hosted events in this category'
                  : eventScope === 'Upcoming'
                    ? 'No upcoming hosted events'
                    : 'No past hosted events'}
              </h3>
              <p>
                {activeCategory !== 'All'
                  ? 'Choose another category to explore this profile.'
                  : eventScope === 'Upcoming'
                    ? 'Switch to past events to explore the archive.'
                    : 'Completed events created by this profile will appear here.'}
              </p>
            </div>
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
