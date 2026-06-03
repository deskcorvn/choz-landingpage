import Image from 'next/image';
import { MotionReveal } from './ZStationMotion';
import { trustedLogos } from './z-station-data';

export default function ZStationTrustedSection() {
	const logos = [...trustedLogos, ...trustedLogos, ...trustedLogos];

	return (
		<section className='bg-white py-16 lg:py-20'>
			<MotionReveal className='miniapp-container text-center'>
				<h2 className='text-[32px] font-bold leading-[42px] text-[#7f1d1d] sm:text-[34px] sm:leading-[47.6px]'>Chợ Z kết nối công nghệ, truyền thông và logistics</h2>
				<p className='mx-auto mt-4 max-w-[680px] text-[16px] leading-[29px] text-[#6b7280]'>
					Mô hình gồm 3 bộ phận chính: Công nghệ - Truyền thông, Logistics và Quản trị hệ thống, cùng hướng tới vận hành tinh gọn cho nhà cung cấp và người dùng.
				</p>
				<div className='relative mt-10 overflow-hidden sm:mt-12 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]'>
					<div className='logo-strip flex w-max items-center gap-10 sm:gap-[62px]'>
						{logos.map((logo, index) => (
							<Image key={`${logo.src}-${index}`} src={logo.src} alt={logo.alt} width={160} height={80} className='h-16 w-32 shrink-0 object-contain grayscale transition-all duration-300 hover:-translate-y-1 hover:grayscale-0 hover:drop-shadow-[0_12px_18px_rgba(127,29,29,0.12)] sm:h-20 sm:w-40' />
						))}
					</div>
				</div>
			</MotionReveal>
		</section>
	);
}
