import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import AppHeader from '../components/layout/AppHeader';
import LocationPicker from '../components/maps/LocationPicker';
import type { SelectedLocation } from '../types/location';

function CreateEventPage() {
  const [isPublished, setIsPublished] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [locationError, setLocationError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedLocation) {
      setLocationError('Choose a location from the Google suggestions.');
      return;
    }

    setLocationError('');
    setIsPublished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell create-event-shell">
      <AppHeader />

      <main className="create-event-main section-container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Create event</span>
        </nav>

        <div className="create-event-layout">
          <header className="create-event-intro">
            <p className="eyebrow">Host on EduMeet</p>
            <h1>Create an event people will remember.</h1>
            <p>
              Add the essentials now. You can refine the details before your
              event reaches the community.
            </p>
          </header>

          <section className="event-form-card" aria-labelledby="form-title">
            {isPublished && (
              <div className="mock-success" role="status">
                <div>
                  <strong>Your event preview is ready.</strong>
                  <p>This is a mock submission—no data was sent to the backend.</p>
                </div>
                <button type="button" onClick={() => setIsPublished(false)}>
                  Dismiss
                </button>
              </div>
            )}

            <div className="form-heading">
              <h2 id="form-title">Tell us about your event</h2>
              <p>Fields marked with an asterisk are required.</p>
            </div>

            <form onSubmit={handleSubmit}>
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
                  <small>Use a clear, descriptive title. Maximum 150 characters.</small>
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
                    <strong>{fileName || 'Upload a cover image'}</strong>
                    <small>PNG, JPG or WebP · Recommended 1600 × 900</small>
                  </label>
                  <input
                    className="visually-hidden"
                    id="event-image"
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      setFileName(event.target.files?.[0]?.name ?? '')
                    }
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Date &amp; location</legend>

                <div className="form-grid form-grid-two">
                  <div className="form-field">
                    <label htmlFor="event-date">Date *</label>
                    <input id="event-date" name="date" type="date" required />
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
        </div>
      </main>
    </div>
  );
}

export default CreateEventPage;
