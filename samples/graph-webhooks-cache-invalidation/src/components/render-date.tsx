// This file contains a Client-side component.
//
// Given a `date` it renders the number of seconds elapsed from that time to the current time.
// The "current time" is calculated from visitors browser.
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
  }, [date]);

  const seconds = Math.floor(elapsedTime / 1000);
  if (seconds <= 0) {
    return <></>;
  }
  return <>{seconds} seconds ago</>;
}
