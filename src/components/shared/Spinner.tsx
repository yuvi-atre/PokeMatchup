export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <span
      className={`inline-block ${cls} animate-spin rounded-full border-2 border-gray-600 border-t-gray-300`}
      role="status"
      aria-label="Loading"
    />
  );
}
