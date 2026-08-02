import type { MockEvent } from '../../types/event';

interface EventCardProps {
  event: MockEvent;
}

function EventCard({ event }: EventCardProps) {
  return (
    <article className="event-card">
      <div className={`event-card-art event-card-art-${event.visualTone}`}>
        <span className="event-category">{event.category}</span>
        <span className="event-art-code" aria-hidden="true">
          {event.artCode}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-date-block" aria-label={event.fullDate}>
          <span>{event.month}</span>
          <strong>{event.day}</strong>
        </div>
        <div className="event-card-copy">
          <p>{event.format} · {event.time}</p>
          <h3>{event.title}</h3>
          <span className="event-location">{event.locationName}</span>
        </div>
      </div>

      <div className="event-card-footer">
        <div className="organizer-initial" aria-hidden="true">
          {event.organizer.charAt(0)}
        </div>
        <span>By {event.organizer}</span>
        <strong>{event.price}</strong>
      </div>
    </article>
  );
}

export default EventCard;
