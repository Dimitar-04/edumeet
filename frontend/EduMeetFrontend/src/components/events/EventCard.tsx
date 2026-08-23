import { resolvePublicAssetUrl } from '../../api/apiConfig';
import { useState } from 'react';
import { Link } from 'react-router';
import type { EventCategory } from '../../types/event/common';
import type { EducationalEventResponse } from '../../types/event/responses';
import UserAvatar from '../user/UserAvatar';

interface EventCardProps {
  event: EducationalEventResponse;
}

const categoryTones: Record<
  EventCategory,
  'blue' | 'charcoal' | 'cream' | 'silver'
> = {
  Technology: 'blue',
  Design: 'cream',
  Business: 'charcoal',
  Science: 'silver',
  Languages: 'cream',
  Community: 'blue',
};

function EventCard({ event }: EventCardProps) {
  const [renderedAt] = useState(Date.now);
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleDateString('en', { month: 'short' });
  const day = eventDate.toLocaleDateString('en', { day: '2-digit' });
  const fullDate = eventDate.toLocaleDateString('en', {
    dateStyle: 'long',
  });
  const time = eventDate.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const artCode = event.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
  const visualTone = categoryTones[event.category] ?? 'silver';
  const isPastEvent = eventDate.getTime() <= renderedAt;

  return (
    <Link
      className="event-card-link"
      to={`/events/${event.id}`}
      aria-label={`View ${event.title}`}
    >
      <article className={`event-card ${isPastEvent ? 'event-card-past' : ''}`}>
        <div className={`event-card-art event-card-art-${visualTone}`}>
          {event.imageUrl ? (
            <img
              className="event-card-image"
              src={resolvePublicAssetUrl(event.imageUrl)}
              alt=""
            />
          ) : null}
          <span className="event-category">{event.category}</span>
          {!event.imageUrl ? (
            <span className="event-art-code" aria-hidden="true">
              {artCode}
            </span>
          ) : null}
        </div>

        <div className="event-card-body">
          <div className="event-date-block" aria-label={fullDate}>
            <span>{month}</span>
            <strong>{day}</strong>
          </div>
          <div className="event-card-copy">
            <p>
              {event.format} · {time}
            </p>
            <h3>{event.title}</h3>
            <span className="event-location">{event.locationName}</span>
          </div>
        </div>

        <div className="event-card-footer">
          <UserAvatar
            className="organizer-initial"
            userName={event.organizerName}
            imageUrl={event.organizerImageUrl}
          />
          <span>By {event.organizerName}</span>
          {isPastEvent && event.averageRating !== null ? (
            <strong>{event.averageRating.toFixed(1)} / 5</strong>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export default EventCard;
