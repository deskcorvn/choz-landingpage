import Link from 'next/link';
import HeaderCta from './HeaderCta';
import { MotionReveal } from './ZStationMotion';

export default function ZStationHero() {
	return (
		<section id='home' className='relative flex overflow-hidden bg-white min-h-screen lg:pt-31.5 lg:pb-12'>
			<div
				className='absolute inset-0 bg-cover bg-center bg-no-repeat lg:hidden'
				style={{ backgroundImage: "url('/images/miniapp/banner_mobie.png')" }}
			/>
			<div
				className='absolute inset-0 hidden bg-cover bg-no-repeat lg:block'
				style={{
					backgroundImage: "url('/images/miniapp/banner.png')",
					backgroundPosition: 'right 32% center',
				}}
			/>
			<div className='absolute inset-0 hidden bg-linear-to-r from-white via-white/85 to-white/10 lg:block lg:via-white/72 lg:to-transparent' />
			<div className='miniapp-container relative z-10 hidden flex-1 items-center lg:flex'>
				<MotionReveal className='max-w-150 text-center lg:text-left' direction='left' amount={0.32}>
					<h1 className='mt-5 text-[40px] font-bold leading-[1.12] tracking-[-0.035em] text-[#7f1d1d] sm:text-[52px] lg:text-[60px]'>
						Chợ Z - kênh D2C từ gốc đến người dùng
					</h1>
					<p className='mx-auto mt-5 max-w-135 text-[16px] leading-7 text-[#4b5563] lg:mx-0'>
						Chợ Z kết hợp công nghệ, truyền thông, logistics và mạng lưới Trạm để đưa hàng gốc đến người
						dùng nhanh hơn, rõ hơn và tiết kiệm hơn.
					</p>
					<div className='mt-7 flex flex-wrap justify-center gap-4 lg:justify-start'>
						<HeaderCta href='#hop-tac'>Đề xuất hợp tác</HeaderCta>
						<Link
							href='#kieu-z'
							className='inline-flex h-14 items-center rounded-full border border-red-100 bg-white/90 px-8 text-[14px] font-bold text-[#111827] shadow-xs backdrop-blur transition-colors duration-300 hover:bg-red-50'
						>
							Kiểu Z là gì?
						</Link>
					</div>
				</MotionReveal>
			</div>
		</section>
	);
}
