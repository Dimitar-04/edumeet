import { Link } from 'react-router';
import { resolvePublicAssetUrl } from '../../api/apiConfig';
import type { ProfileEventResponse } from '../../types/user/responses';

interface ProfileEventCardProps {
  event: ProfileEventResponse;
  showRating: boolean;
  relationship: 'hosted' | 'attended';
}

function ProfileEventCard({
  event,
  showRating,
  relationship,
}: ProfileEventCardProps) {
  const eventDate = new Date(event.date);
  const initials = event.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <Link
      className="profile-event-card"
      to={`/events/${event.id}`}
      aria-label={`View ${event.title}`}
    >
      <div className="profile-event-art">
        {event.imageUrl ? (
          <img src={resolvePublicAssetUrl(event.imageUrl)} alt="" />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
        <strong>{event.category}</strong>
        <small className={`profile-event-role profile-event-role-${relationship}`}>
          {relationship === 'hosted' ? 'Created' : 'Attended'}
        </small>
      </div>

      <div className="profile-event-copy">
        <p>
          {eventDate.toLocaleDateString('en', { dateStyle: 'medium' })}
          {' · '}
          {event.format}
        </p>
        <h3>{event.title}</h3>
        <span>{event.locationName}</span>

        {showRating ? (
          <div className="profile-event-rating">
            {event.averageRating === null ? (
              <span>Not rated yet</span>
            ) : (
              <>
                <strong>{event.averageRating.toFixed(1)} / 5</strong>
                <span>
                  {event.ratingCount}{' '}
                  {event.ratingCount === 1 ? 'rating' : 'ratings'}
                </span>
              </>
            )}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default ProfileEventCard;
