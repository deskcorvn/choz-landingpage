import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { MotionReveal } from './ZStationMotion';

export default function ZStationVideoSection() {
	return (
		<section id='hop-tac' className='bg-white py-16 lg:py-24'>
			<div className='miniapp-container'>
				<MotionReveal className='relative overflow-hidden rounded-[32px] border border-red-100 bg-white px-5 py-16 text-center text-[#111827] transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_24px_70px_rgba(127,29,29,0.12)] sm:rounded-[36px] sm:px-12 sm:py-20 lg:py-28'>
					<Image src='/images/miniapp/cta-bg.webp' alt='Nền hợp tác Chợ Z' fill sizes='1140px' className='object-cover opacity-80' />
					<div className='absolute inset-0 bg-white/82' />
					<div className='relative z-10 mx-auto max-w-[700px]'>
						<h2 className='text-[30px] font-bold leading-[40px] text-[#7f1d1d] sm:text-[40px] sm:leading-[56px]'>Đề xuất hợp tác cùng nhà cung cấp và đối tác vận hành</h2>
						<Link href='#newsletter-email' className='group mx-auto mt-7 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-[16px] font-bold text-[#111827] transition-colors duration-300 hover:bg-red-50 sm:mt-8 sm:gap-4 sm:px-7 sm:py-4'>
							<span className='grid size-12 place-items-center rounded-full bg-[#b91c1c] text-white transition-colors duration-300 group-hover:bg-[#991b1b] sm:size-[60px]'>
								<Play className='ml-1 size-5 fill-current sm:size-6' />
							</span>
							Kết nối ngay
						</Link>
					</div>
				</MotionReveal>
			</div>
		</section>
	);
}
