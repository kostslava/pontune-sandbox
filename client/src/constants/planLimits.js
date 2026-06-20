/** Mirrors docker-compose Piston limits — update when tier config changes. */
export const PLAN_LIMITS = {
  label: 'Dev',
  runTimeoutMs: 3_600_000,
  runMemoryBytes: null,
  maxCpuPercent: 100,
  outputMaxBytes: 131072,
};

export function formatBytes(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function formatLimit(value, formatter = String) {
  return value == null ? '∞' : formatter(value);
}
