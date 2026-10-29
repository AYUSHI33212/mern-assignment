// Shows the user's picture, or their initials when there is none.
export default function Avatar({ user, src, size = 36 }) {
  const initials = (user?.name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const style = { width: size, height: size, fontSize: size * 0.38 };
  const url = src ?? user?.avatar?.url;
  return url ? (
    <img className="avatar" style={style} src={url} alt={user?.name ?? 'Profile'} />
  ) : (
    <span className="avatar initials" style={style} aria-label={user?.name}>
      {initials}
    </span>
  );
}