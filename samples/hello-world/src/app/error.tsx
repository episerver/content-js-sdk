'use client';

import { useEffect } from 'react';
import { GraphErrors } from '@optimizely/cms-sdk';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Use `instanceof` to get specific types of errors and handle differently
    if (error instanceof GraphErrors.GraphResponseError) {
      console.error(
        'Optimizely Graph Error: ',
        error.message,
        'see the query and variables in the logs'
      );
      console.log('Showing the query:');
      console.log(error.request.query);
      console.log('Showing variables:');
      console.log(error.request.variables);
    } else {
      console.error(error);
    }
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
