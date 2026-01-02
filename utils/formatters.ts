export const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;

export const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
};