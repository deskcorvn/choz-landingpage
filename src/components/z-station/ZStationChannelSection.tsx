'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import CountUpMetric from './CountUpMetric';
import { MotionItem, MotionReveal, MotionStagger } from './ZStationMotion';
import { channelBenefits } from './z-station-data';

const compactBenefits = [
	'Tối ưu chi phí',
	'Đặt - nhận gần nhà',
	'Đa dạng sản phẩm',
	'Minh bạch tiêu chuẩn',
	'Nắm bắt nhu cầu',
];

export default function ZStationChannelSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [startCountUp, setStartCountUp] = useState(false);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section || startCountUp) return;

		const observer = new IntersectionObserver(
			entries => {
				if (entries.some(entry => entry.isIntersecting)) {
					setStartCountUp(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.28 }
		);

		observer.observe(section);

		return () => observer.disconnect();
	}, [startCountUp]);

	return (
		<section ref={sectionRef} id='uu-diem' className='miniapp-section relative overflow-hidden'>
			<div className='absolute inset-x-0 top-0 h-40' />
			<div className='miniapp-container relative'>
				<div className='grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center'>
					<MotionReveal className='order-1 lg:order-2' direction='right'>
						<h2 className='miniapp-title mt-4 max-w-190 text-[#0f766e]'>
							Khai mở kênh bán trực tiếp cho nhà cung cấp
						</h2>
						<p className='mt-5 max-w-155 text-[16px] leading-7 text-[#4b5563] sm:text-[17px]'>
							Chợ Z kết nối nhà cung cấp với người dùng qua mạng lưới Trạm gần nhà, giảm trung gian và
							tăng tốc giao dịch.
						</p>
						<MotionStagger className='mt-8 grid gap-3 sm:grid-cols-2'>
							{channelBenefits.map((benefit, index) => (
								<MotionItem key={benefit.title}>
									<article className='h-full rounded-[22px] border border-[#111827]/10 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0f766e]/30 hover:bg-white hover:shadow-[0_20px_52px_rgba(15,118,110,0.13)]'>
										<div className='flex items-start justify-between gap-4'>
											<div>
												<span className='text-[12px] font-black tracking-[0.16em] text-[#9ca3af] uppercase'>
													{String(index + 1).padStart(2, '0')}
												</span>
												<h3 className='mt-3 text-[16px] font-extrabold leading-[1.3] text-[#111827]'>
													{compactBenefits[index]}
												</h3>
												<p className='mt-2 text-[13px] leading-5 text-[#6b7280]'>
													{benefit.metricLabel}
												</p>
											</div>
											<p className='shrink-0 text-[30px] font-black leading-none tracking-[-0.04em] text-[#111827]'>
												<CountUpMetric
													value={benefit.metricValue}
													suffix={benefit.metricSuffix}
													decimals={benefit.metricDecimals}
													start={startCountUp}
												/>
											</p>
										</div>
									</article>
								</MotionItem>
							))}
						</MotionStagger>
					</MotionReveal>

					<MotionReveal
						className='relative order-1 min-h-[560px] sm:order-2 lg:min-h-[680px]'
						direction='left'
					>
						<div className='pointer-events-none absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f97316]/10 blur-3xl sm:h-[560px] sm:w-[560px]' />
						<div className='floating-slow relative mx-auto w-[280px] sm:w-[340px] lg:w-[390px]'>
							<Image
								src='/images/miniapp/10.png'
								alt='Khung điện thoại hiển thị kênh Chợ Z'
								width={318}
								height={680}
								className='relative z-10 h-auto w-full drop-shadow-[0_36px_55px_rgba(124,45,18,0.24)]'
							/>
						</div>
					</MotionReveal>
				</div>
			</div>
		</section>
	);
}
