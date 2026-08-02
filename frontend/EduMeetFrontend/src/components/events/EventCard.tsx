import { resolvePublicAssetUrl } from '../../api/apiConfig';
import type { EducationalEvent, EventCategory } from '../../types/event';
import UserAvatar from '../user/UserAvatar';

interface EventCardProps {
  event: EducationalEvent;
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

  return (
    <article className="event-card">
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
          <p>{event.format} · {time}</p>
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
      </div>
    </article>
  );
}

export default EventCard;
