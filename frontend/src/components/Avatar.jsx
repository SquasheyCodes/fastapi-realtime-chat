// Full class names (not built dynamically) so Tailwind can see them.
const COLORS = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
];

function colorFor(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export default function Avatar({ name, size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  return (
    <span
      aria-hidden="true"
      className={`${dimensions} ${colorFor(name)} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
