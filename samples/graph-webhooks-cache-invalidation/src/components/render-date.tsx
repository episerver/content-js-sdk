// This file contains a Client-side component.
//
// Given a `date` it renders the number of seconds elapsed from that time to the current time.
// The "current time" is calculated from visitors browser.
'use client';
import { useEffect, useState } from 'react';

/** Render the elapsed time from a given `date` */
export function ShowElapsed({ date }: { date: string }) {
  // Starts at 0 rather than reading the clock during render: the server and the
  // browser render at different instants, so a `Date.now()` initializer would
  // produce a hydration mismatch. The first tick runs immediately in the effect.
  const [elapsedTime, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Date.now() - new Date(date).getTime());
    tick();
    const i = setInterval(tick, 1000);

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
