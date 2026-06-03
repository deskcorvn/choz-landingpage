'use client';

import dynamic from 'next/dynamic';

const ZStationMapSection = dynamic(() => import('./ZStationMapSection'), {
  ssr: false,
});

export default function ZStationMapWrapper() {
  return <ZStationMapSection />;
}
