import axios from 'axios';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router';
import { createEvent } from '../api/eventsApi';
import AppHeader from '../components/layout/AppHeader';
import LocationPicker from '../components/maps/LocationPicker';
import { useAuth } from '../contexts/AuthContext';
import type { ValidationProblemDetails } from '../types/api/errors';
import type { EventCategory } from '../types/event/common';
import type { CreateEducationalEventRequest } from '../types/event/requests';
import type { SelectedLocation } from '../types/location';

interface EventPreview {
  title: string;
  description: string;
  category: EventCategory;
  format: string;
  date: Date;
  location: SelectedLocation;
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [stage, setStage] = useState<'edit' | 'preview' | 'success'>('edit');
  const [preview, setPreview] = useState<EventPreview | null>(null);
  const [fileName, setFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [locationError, setLocationError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (stage !== 'success') return;

    const redirectTimer = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 2200);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, stage]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const buildSubmission = () => {
    if (!formRef.current || !selectedLocation) return null;

    const formData = new FormData(formRef.current);
    const date = readText(formData, 'date');
    const time = readText(formData, 'time');
    const eventDate = new Date(`${date}T${time}`);

    if (Number.isNaN(eventDate.getTime())) return null;

    const imageValue = formData.get('image');
    const image =
      imageValue instanceof File && imageValue.size > 0
        ? imageValue
        : null;

    const request: CreateEducationalEventRequest = {
      title: readText(formData, 'title'),
      description: readText(formData, 'description'),
      category: readText(formData, 'category') as EventCategory,
      format: readText(formData, 'format'),
      image,
      date: eventDate.toISOString(),
      ...selectedLocation,
    };

    return { request, eventDate };
  };

  const handlePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPublishError('');

    if (!selectedLocation) {
      setLocationError('Choose a location from the Google suggestions.');
      return;
    }

    const submission = buildSubmission();
    if (!submission) {
      setPublishError('Choose a valid date and start time.');
      return;
    }

    if (submission.eventDate <= new Date()) {
      setPublishError('Choose a start time that is still in the future.');
      return;
    }

    const request = submission.request;

    setPreview({
      title: request.title,
      description: request.description,
      category: request.category,
      format: request.format,
      date: submission.eventDate,
      location: selectedLocation,
    });
    setStage('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async () => {
    if (!user) {
      setPublishError('Please sign in before publishing your event.');
      return;
    }

    const submission = buildSubmission();
    if (!submission) {
      setPublishError('The event date or time is no longer valid.');
      return;
    }

    try {
      setIsPublishing(true);
      setPublishError('');
      await createEvent(submission.request);
      setStage('success');
    } catch (error) {
      let message = 'Your event could not be published. Please try again.';

      if (axios.isAxiosError(error)) {
        const errors = (error.response?.data as ValidationProblemDetails | undefined)
          ?.errors;
        const firstError = errors ? Object.values(errors).flat()[0] : undefined;

        if (firstError) message = firstError;
      }

      setPublishError(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="app-shell create-event-shell">
      <AppHeader />

      <main className="create-event-main section-container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{stage === 'edit' ? 'Create event' : 'Preview event'}</span>
        </nav>

        <div className="create-event-layout">
          <header className="create-event-intro">
            <p className="eyebrow">Host on EduMeet</p>
            <h1>
              {stage === 'edit'
                ? 'Create an event people will remember.'
                : 'This is how your event will appear.'}
            </h1>
            <p>
              {stage === 'edit'
                ? 'Add the essentials, preview the result, then publish it to the community.'
                : 'Review every detail before making your event visible on EduMeet.'}
            </p>
          </header>

          <section
            className="event-form-card"
            aria-labelledby="form-title"
            hidden={stage !== 'edit'}
          >
            <div className="form-heading">
              <h2 id="form-title">Tell us about your event</h2>
              <p>Fields marked with an asterisk are required.</p>
            </div>

            <form ref={formRef} onSubmit={handlePreview}>
              <fieldset>
                <legend>Event details</legend>

                <div className="form-field">
                  <label htmlFor="event-title">Event title *</label>
                  <input
                    id="event-title"
                    name="title"
                    type="text"
                    placeholder="e.g. Introduction to product design"
                    maxLength={150}
                    required
                  />
                  <small>
                    Use a clear, descriptive title. Maximum 150 characters.
                  </small>
                </div>

                <div className="form-grid form-grid-two">
                  <div className="form-field">
                    <label htmlFor="event-category">Category *</label>
                    <select id="event-category" name="category" required>
                      <option value="">Choose a category</option>
                      <option>Technology</option>
                      <option>Design</option>
                      <option>Business</option>
                      <option>Science</option>
                      <option>Languages</option>
                      <option>Community</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="event-format">Event format *</label>
                    <select id="event-format" name="format" required>
                      <option value="">Choose a format</option>
                      <option>Workshop</option>
                      <option>Talk</option>
                      <option>Meetup</option>
                      <option>Course</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="event-description">Description *</label>
                  <textarea
                    id="event-description"
                    name="description"
                    placeholder="What will people learn, who is it for, and what should they bring?"
                    rows={7}
                    maxLength={2000}
                    required
                  />
                  <small>Maximum 2,000 characters.</small>
                </div>

                <div className="form-field">
                  <label htmlFor="event-image">Cover image</label>
                  <label className="file-drop" htmlFor="event-image">
                    {imagePreviewUrl ? (
                      <img
                        className="file-drop-preview"
                        src={imagePreviewUrl}
                        alt="Selected event cover"
                      />
                    ) : null}
                    <span className="file-drop-copy">
                      <strong>{fileName || 'Upload a cover image'}</strong>
                      <small>
                        {imagePreviewUrl
                          ? 'Click to choose a different image'
                          : 'PNG, JPG or WebP · Recommended 1600 × 900'}
                      </small>
                    </span>
                  </label>
                  <input
                    className="visually-hidden"
                    id="event-image"
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setFileName(file?.name ?? '');
                      setImagePreviewUrl(file ? URL.createObjectURL(file) : '');
                    }}
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Date &amp; location</legend>

                <div className="form-grid form-grid-two">
                  <div className="form-field">
                    <label htmlFor="event-date">Date *</label>
                    <input
                      id="event-date"
                      name="date"
                      type="date"
                      min={today}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="event-time">Start time *</label>
                    <input id="event-time" name="time" type="time" required />
                  </div>
                </div>

                <div className="form-field">
                  <span className="form-field-label">Location *</span>
                  <LocationPicker
                    value={selectedLocation}
                    error={locationError}
                    onChange={(location) => {
                      setSelectedLocation(location);
                      setLocationError('');
                    }}
                  />
                </div>
              </fieldset>

              {publishError ? (
                <p className="publish-error" role="alert">{publishError}</p>
              ) : null}

              <div className="form-actions">
                <Link className="button button-secondary" to="/">
                  Cancel
                </Link>
                <button className="button button-primary" type="submit">
                  Preview event
                </button>
              </div>
            </form>
          </section>

          {preview && stage !== 'edit' ? (
            <section className="event-preview-card" aria-labelledby="preview-title">
              <div className="event-preview-cover">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Event cover preview" />
                ) : (
                  <span aria-hidden="true">
                    {preview.title
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word.charAt(0))
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
                <strong>{preview.category}</strong>
              </div>

              <div className="event-preview-content">
                <p className="event-preview-meta">
                  {preview.format} ·{' '}
                  {preview.date.toLocaleDateString('en', { dateStyle: 'long' })}{' '}
                  at{' '}
                  {preview.date.toLocaleTimeString('en', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <h2 id="preview-title">{preview.title}</h2>
                <p className="event-preview-description">{preview.description}</p>

                <div className="event-preview-location">
                  <span>Location</span>
                  <strong>{preview.location.locationName}</strong>
                  <p>{preview.location.address}</p>
                </div>

                {publishError ? (
                  <p className="publish-error" role="alert">
                    {publishError}{' '}
                    {!user ? <Link to="/login">Sign in</Link> : null}
                  </p>
                ) : null}

                <div className="form-actions preview-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={isPublishing}
                    onClick={() => {
                      setPublishError('');
                      setStage('edit');
                    }}
                  >
                    Edit details
                  </button>
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={isPublishing}
                    onClick={() => void handlePublish()}
                  >
                    {isPublishing ? 'Publishing…' : 'Publish event'}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      {stage === 'success' ? (
        <div className="event-created-backdrop" role="presentation">
          <div className="event-created-popup" role="status" aria-live="polite">
            <strong>Your event is live!</strong>
            <p>Thank you for bringing people together. Taking you home…</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CreateEventPage;
