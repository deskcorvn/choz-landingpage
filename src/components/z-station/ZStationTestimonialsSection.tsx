import Image from 'next/image';
import { Star } from 'lucide-react';
import { MotionReveal } from './ZStationMotion';
import { testimonials } from './z-station-data';

export default function ZStationTestimonialsSection() {
	const cards = [...testimonials, ...testimonials, ...testimonials];

	return (
		<section className='relative overflow-hidden bg-white py-16 text-[#111827] lg:py-24'>
			<Image src='/images/miniapp/testimonial-bg.webp' alt='Nền phản hồi Chợ Z' fill sizes='100vw' className='object-cover opacity-5' />
			<div className='relative z-10'>
				<MotionReveal className='miniapp-container text-center'>
					<h2 className='text-[32px] font-bold leading-[42px] text-[#7f1d1d] sm:text-[45px] sm:leading-[56px]'>Các điểm nổi bật trong mô hình Chợ Z</h2>
					<p className='mx-auto mt-4 max-w-[600px] text-[16px] leading-[29px] text-[#4b5563]'>Tóm tắt từ tài liệu giới thiệu Chợ Z và Kiểu Z.</p>
				</MotionReveal>
				<div className='mt-10 overflow-hidden sm:mt-14 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]'>
					<div className='testimonial-strip flex w-max gap-5 px-4 sm:gap-7 sm:px-6'>
						{cards.map((testimonial, index) => (
							<article key={`${testimonial.name}-${index}`} className='w-[532px] max-w-[calc(100vw-32px)] shrink-0 rounded-[24px] bg-white p-5 text-[#1f2937] shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(127,29,29,0.12)] sm:max-w-[calc(100vw-48px)] sm:rounded-[28px] sm:p-8'>
								<div className='flex items-center gap-4 sm:gap-5'>
									<Image src={testimonial.image} alt={testimonial.name} width={150} height={150} className='size-16 rounded-full sm:size-[92px] object-cover' />
									<div>
										<div className='flex text-[#111827]'>
											{Array.from({ length: 5 }).map((_, starIndex) => (
												<Star key={starIndex} className='size-4 fill-current' />
											))}
										</div>
										<h3 className='mt-3 text-[18px] font-bold leading-[23px] text-[#111827]'>{testimonial.name}</h3>
										<p className='mt-1 text-[14px] font-medium text-[#6b7280]'>{testimonial.role}</p>
									</div>
								</div>
								<p className='mt-5 text-[15px] leading-[27px] sm:mt-6 sm:text-[16px] sm:leading-[29px] text-[#4b5563]'>{testimonial.quote}</p>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
