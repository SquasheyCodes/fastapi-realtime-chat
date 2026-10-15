// A stable colour per name. The hue snaps to one of ten evenly spaced steps so
// two different people never end up with near-identical shades.
function hueFor(name) {
  let hash = 2166136261; // FNV-1a
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return (hash % 10) * 36 + 12;
}

const SIZES = {
  xs: 'h-6 w-6 text-[11px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
};

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      style={{ '--h': hueFor(name) }}
      className={`avatar inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${SIZES[size]} ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
