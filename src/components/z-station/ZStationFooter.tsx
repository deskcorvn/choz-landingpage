import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { MotionItem, MotionReveal, MotionStagger } from './ZStationMotion';
import { footerGroups } from './z-station-data';

export default function ZStationFooter() {
	return (
		<footer id='lien-he' className='bg-white pb-8 pt-16 sm:pb-10 border-t border-red-100'>
			<div className='miniapp-container grid gap-8 sm:gap-10 lg:grid-cols-[1.12fr_1.88fr]'>
				<MotionReveal direction='left'>
					<Image
						src='/images/miniapp/logo.svg'
						alt='Chợ Z'
						width={56}
						height={56}
						className='h-14 w-14 transition-transform duration-300 hover:-translate-y-1'
					/>
					<h2 className='mt-6 max-w-90 text-[20px] font-bold leading-7 text-[#111827]'>
						Kênh phân phối D2C và mạng lưới Trạm giao dịch
					</h2>
					<ul className='mt-6 space-y-4 text-[14px] leading-6.25 text-[#6b7280]'>
						<li className='flex gap-3 rounded-2xl transition-colors duration-300 hover:text-[#b91c1c]'>
							<MapPin className='mt-1 size-5 shrink-0 text-[#111827]' />
							<span>Địa chỉ: 105 Bạch Đằng, Hồng Bàng, Hải Phòng</span>
						</li>
						<li className='flex gap-3 rounded-2xl transition-colors duration-300 hover:text-[#b91c1c]'>
							<Mail className='mt-1 size-5 shrink-0 text-[#111827]' />
							<span>Email: congtysinhtin@gmail.com</span>
						</li>
						<li className='flex gap-3 rounded-2xl transition-colors duration-300 hover:text-[#b91c1c]'>
							<Phone className='mt-1 size-5 shrink-0 text-[#111827]' />
							<span>Hotline: +84-777.203.203</span>
						</li>
					</ul>
				</MotionReveal>
				<MotionStagger className='grid gap-7 sm:grid-cols-2 sm:gap-8 xl:grid-cols-4'>
					{footerGroups.map(group => (
						<MotionItem key={group.title}>
							<div className='rounded-2xl transition-all duration-300 hover:-translate-y-1'>
								<h3 className='text-[16px] font-bold leading-6.25 text-[#111827]'>{group.title}</h3>
								<ul className='mt-5 space-y-3'>
									{group.links.map(link => (
										<li key={link}>
											<Link
												href='#home'
												className='text-[14px] leading-6.25 text-[#6b7280] transition-colors hover:text-[#b91c1c]'
											>
												{link}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</MotionItem>
					))}
				</MotionStagger>
			</div>
			<div
				className='miniapp-container mt-10 border-t border-red-100 pt-6 text-center text-[13px] text-[#9ca3af] sm:mt-12 sm:pt-7'
			>
				© 2026 Chợ Z. SINHTIN & GIFTYTECH.
			</div>
		</footer>
	);
}
