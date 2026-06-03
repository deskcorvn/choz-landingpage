import Image from 'next/image';
import { Check } from 'lucide-react';
import { MotionItem, MotionReveal, MotionStagger } from './ZStationMotion';
import { businessBenefits } from './z-station-data';

export default function ZStationBusinessSection() {
	return (
		<section id='van-hanh' className='miniapp-section bg-white'>
			<div className='miniapp-container grid items-center gap-10 lg:gap-12 lg:grid-cols-[0.7fr_1.3fr]'>
				<MotionReveal className='relative mx-auto min-h-[430px] w-full max-w-[500px] sm:min-h-[560px] lg:min-h-[620px]' direction='left'>
					<div className='absolute left-1/2 top-1/2 h-[320px] w-[320px] sm:h-[430px] sm:w-[430px] lg:h-[470px] lg:w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white' />
					<Image src='/images/miniapp/5.png' alt='Giao diện vận hành Chợ Z' width={372} height={700} loading='eager' className='floating-slow relative z-10 mx-auto h-auto w-[260px] max-w-full sm:w-[330px] lg:w-[360px] drop-shadow-xs' />
				</MotionReveal>
				<MotionReveal direction='right'>
					<p className='text-[20px] font-semibold leading-[25px] text-[#111827]'>Lợi ích vận hành</p>
					<h2 className='miniapp-title mt-3'>Tổ chức đủ 3 lớp để giảm chi phí và tăng độ phủ</h2>
					<p className='miniapp-copy mt-5 max-w-[620px]'>
						Chợ Z đảm nhiệm trọn vẹn các công đoạn cần thiết để nhà cung cấp bán trực tiếp hơn, còn người dùng nhận hàng tiện hơn qua mạng lưới Trạm giao dịch mật độ cao.
					</p>
					<MotionStagger className='mt-8 space-y-4 sm:mt-9 sm:space-y-5'>
						{businessBenefits.map(benefit => (
							<MotionItem key={benefit.title}>
								<BenefitCard title={benefit.title} description={benefit.description} />
							</MotionItem>
						))}
					</MotionStagger>
				</MotionReveal>
			</div>
		</section>
	);
}

function BenefitCard({ title, description }: { title: string; description: string }) {
	return (
		<div className='group flex gap-3 rounded-[24px] border border-red-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_42px_rgba(127,29,29,0.10)] sm:gap-4'>
			<span className='grid size-12 shrink-0 place-items-center rounded-2xl bg-[#b91c1c] text-white'>
				<Check className='size-5' />
			</span>
			<div>
				<h3 className='text-[18px] font-bold leading-[23px] text-[#111827]'>{title}</h3>
				<p className='mt-2 text-[15px] leading-[25px] text-[#6b7280]'>{description}</p>
			</div>
		</div>
	);
}
