import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";

const FriendCard = ({ friend }) => {
  const unreadCount = 2;
  const lastSeen = "12:30 PM";

  return (
    <Link
      to={`/chat/${friend._id}`}
      className="rounded-2xl border border-base-300 bg-base-100/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-base-200"
    >
      <div className="flex items-start gap-3">
        <div className="avatar size-12 rounded-full ring-2 ring-primary/20">
          <img src={friend.profilePic} alt={friend.fullName} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{friend.fullName}</h3>
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
            </div>
            <span className="text-xs opacity-60">{lastSeen}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm opacity-70">
              {friend.bio || "Tap to start chatting"}
            </p>
            {unreadCount > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-content">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="badge badge-secondary text-xs">
          {getLanguageFlag(friend.nativeLanguage)}
          Native: {friend.nativeLanguage}
        </span>
        <span className="badge badge-outline text-xs">
          {getLanguageFlag(friend.learningLanguage)}
          Learning: {friend.learningLanguage}
        </span>
      </div>
    </Link>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}