import React, { useEffect, useState } from 'react';

const formatRemaining = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours ? `${hours}h ` : ''}${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

const ResponseCountdown = ({ deadline, pending, label = 'Owner response time' }) => {
  const [, refresh] = useState(0);
  useEffect(() => {
    if (!pending || !deadline) return undefined;
    const timer = setInterval(() => refresh(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [deadline, pending]);

  if (!pending || !deadline) return null;
  const remaining = new Date(deadline).getTime() - Date.now();
  return (
    <p className={`mt-2 rounded px-3 py-2 text-sm font-semibold ${remaining > 0 ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
      {remaining > 0 ? `${label}: ${formatRemaining(remaining)}` : 'Response window expired; cancellation is being processed.'}
    </p>
  );
};

export default ResponseCountdown;
