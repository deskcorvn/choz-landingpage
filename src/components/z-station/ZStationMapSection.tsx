'use client';

import { useEffect, useRef } from 'react';
import trackasiagl from 'trackasia-gl';
import 'trackasia-gl/dist/trackasia-gl.css';
import { MapPinned } from 'lucide-react';
import { zStationMapMarkers } from './z-station-data';

const mapCenter = zStationMapMarkers[0];

export default function ZStationMapSection() {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const mapContainer = mapContainerRef.current;
		const trackAsiaApiKey = process.env.NEXT_PUBLIC_TRACKASIA_API_KEY;

		if (!mapContainer || !trackAsiaApiKey) {
			return;
		}

		const styleUrl = `https://maps.track-asia.com/styles/v2/streets.json?key=${encodeURIComponent(trackAsiaApiKey)}`;

		const map = new trackasiagl.Map({
			container: mapContainer,
			style: styleUrl,
			center: [mapCenter.longitude, mapCenter.latitude],
			zoom: 11,
		});

		map.on('styleimagemissing', event => {
			if (event.id === 'marker' && !map.hasImage(event.id)) {
				map.addImage(event.id, { width: 1, height: 1, data: new Uint8Array(4) });
			}
		});

		const markers = zStationMapMarkers.map(station => {
			const popup = new trackasiagl.Popup({ offset: 18 }).setHTML(
				`<strong style="color:#111827;">${station.name}</strong>`
			);

			return new trackasiagl.Marker({ color: station.code === 'TRAM-Z-02' ? '#b91c1c' : '#ef4444' })
				.setLngLat([station.longitude, station.latitude])
				.setPopup(popup)
				.addTo(map);
		});

		return () => {
			markers.forEach(marker => marker.remove());
			map.remove();
		};
	}, []);

	const hasTrackAsiaApiKey = Boolean(process.env.NEXT_PUBLIC_TRACKASIA_API_KEY);

	return (
		<section className='miniapp-section bg-linear-to-b from-white via-red-50/30 to-white'>
			<div className='miniapp-container'>
				<div className='grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-10'>
					<div>
						<p className='text-[20px] font-semibold leading-6.25 text-[#111827]'>Bản đồ Trạm Z</p>
						<h2 className='miniapp-title mt-3'>Mạng lưới 100+ Trạm Z</h2>
						<p className='miniapp-copy mt-5 max-w-155'>
							bao phủ nội thành Hải Phòng, mỗi điểm cách nhau khoảng 500-700m.
						</p>
						<div className='mt-7 grid gap-3 sm:grid-cols-3 lg:max-w-140'>
							<MetricCard value='100+' label='trạm z' />
							<MetricCard value='500-700m' label='khoảng cách tối thiểu' />
							<MetricCard value='500+' label='mục tiêu 2026' />
						</div>
					</div>

					<div className='rounded-4xl bg-white p-3 shadow-[0_24px_70px_rgba(127,29,29,0.12)] ring-1 ring-red-100 sm:p-4'>
						<div className='relative min-h-105 overflow-hidden rounded-3xl bg-red-50 sm:min-h-130'>
							<div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
							{!hasTrackAsiaApiKey ? (
								<div className='absolute inset-0 grid place-items-center bg-white/90 p-6 text-center'>
									<div className='max-w-90 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-red-100'>
										<span className='mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-[#b91c1c]'>
											<MapPinned className='size-6' />
										</span>
										<h3 className='mt-4 text-[18px] font-bold text-[#111827]'>
											Thiếu TrackAsia API key
										</h3>
										<p className='mt-2 text-[14px] leading-6 text-[#6b7280]'>
											Thêm `NEXT_PUBLIC_TRACKASIA_API_KEY` vào `.env.local` để hiển thị bản đồ.
										</p>
									</div>
								</div>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function MetricCard({ value, label }: { value: string; label: string }) {
	return (
		<div className='rounded-2xl bg-white p-4 shadow-xs ring-1 ring-red-100'>
			<p className='text-[18px] font-black leading-6 text-[#b91c1c]'>{value}</p>
			<p className='mt-1 text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]'>{label}</p>
		</div>
	);
}
