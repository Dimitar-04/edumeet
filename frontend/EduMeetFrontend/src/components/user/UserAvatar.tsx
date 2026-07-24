import { useEffect, useState } from 'react';
import { resolvePublicAssetUrl } from '../../api/apiConfig';

interface UserAvatarProps {
  userName: string;
  imageUrl: string | null;
  className?: string;
}

function UserAvatar({
  userName,
  imageUrl,
  className = '',
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedImageUrl = imageUrl
    ? resolvePublicAssetUrl(imageUrl)
    : null;
  const initial = userName.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 text-2xl font-bold text-white ring-4 ring-white shadow-lg ${className}`}
      aria-label={`${userName}'s profile picture`}
    >
      {resolvedImageUrl && !imageFailed ? (
        <img
          className="h-full w-full object-cover"
          src={resolvedImageUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </div>
  );
}

export default UserAvatar;
