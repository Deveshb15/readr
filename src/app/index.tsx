import { Redirect } from 'expo-router';
import { useState } from 'react';

import { repo } from '../data/db';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { ONBOARDED_KEY } from '../features/onboarding/practiceSave';

export default function Index() {
  // Read synchronously so a first launch never flashes the library.
  const [onboarded] = useState(() => repo().getSetting(ONBOARDED_KEY) === '1');
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <LibraryScreen />;
}
