'use client';
import { useEffect, useState } from 'react';

/** Render the elapsed time from a given `date` */
export function ShowElapsed({ date }: { date: string }) {
  const [elapsedTime, setElapsed] = useState(
    Date.now() - new Date(date).getTime()
  );
  useEffect(() => {
    const i = setInterval(() => {
      setElapsed(Date.now() - new Date(date).getTime());
    }, 1000);

    return () => {
      clearInterval(i);
    };
  });

  const seconds = Math.floor(elapsedTime / 1000);
  if (seconds <= 0) {
    return <></>;
  }
  return <>{seconds} seconds ago</>;
}
