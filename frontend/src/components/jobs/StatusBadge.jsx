const colors = {
  active: 'bg-green-900 text-green-300',
  paused: 'bg-yellow-900 text-yellow-300',
  deleted: 'bg-red-900 text-red-300',
  success: 'bg-green-900 text-green-300',
  failed: 'bg-red-900 text-red-300',
  running: 'bg-blue-900 text-blue-300',
  retrying: 'bg-purple-900 text-purple-300',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();

  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
        colors[key] || 'bg-gray-800 text-gray-300'
      }`}
    >
      {status}
    </span>
  );
}
