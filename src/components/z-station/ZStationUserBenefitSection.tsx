import Image from 'next/image';
import { HandCoins, MapPinned, PackageCheck, Store } from 'lucide-react';
import { MotionItem, MotionReveal, MotionStagger } from './ZStationMotion';
import { stats, userBenefits } from './z-station-data';

const benefitIcons = [MapPinned, PackageCheck, Store, HandCoins];

export default function ZStationUserBenefitSection() {
	return (
		<section id='tram-z' className='miniapp-section bg-white'>
			<div className='miniapp-container grid items-center gap-10 lg:gap-14 lg:grid-cols-[0.94fr_1.06fr]'>
				<MotionReveal direction='left'>
					<p className='text-[20px] font-semibold leading-[25px] text-[#111827]'>Trạm giao dịch</p>
					<h2 className='miniapp-title mt-3'>Điểm chạm gần nhà cho nhận hàng, dịch vụ và trải nghiệm</h2>
					<p className='miniapp-copy mt-5 max-w-[610px]'>
						Trạm Z có thể linh hoạt từ 1m² đến hàng trăm m², do Chợ Z đầu tư vận hành, đối tác cung cấp mặt bằng hoặc cửa hiệu truyền thống tham gia nhượng quyền 0 đồng.
					</p>
					<div className='mt-8 rounded-[28px] bg-white p-4 shadow-xs ring-1 ring-red-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(127,29,29,0.10)] sm:mt-9 sm:p-5'>
						<MotionStagger className='grid gap-3 sm:grid-cols-2'>
							{userBenefits.map((benefit, index) => {
								const Icon = benefitIcons[index];

								return (
									<MotionItem key={benefit.title}>
										<div className='flex h-full gap-3 rounded-2xl bg-red-50/35 p-4 ring-1 ring-red-100/70 transition-all duration-300 hover:-translate-y-1 hover:bg-red-50/65 hover:ring-red-200'>
											<span className='grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#b91c1c] shadow-xs ring-1 ring-red-100'>
												<Icon className='size-5' />
											</span>
											<div>
												<h3 className='text-[16px] font-bold leading-6 text-[#111827]'>{benefit.title}</h3>
												<p className='mt-1 text-[13px] leading-5 text-[#6b7280]'>{benefit.description}</p>
											</div>
										</div>
									</MotionItem>
								);
							})}
						</MotionStagger>
						<div className='mt-4 border-t border-red-100 pt-4'>
							<p className='text-[12px] font-black uppercase tracking-[0.18em] text-[#9f1d1d]'>Quy mô vận hành</p>
							<MotionStagger className='mt-3 flex flex-wrap gap-2' staggerChildren={0.04}>
								{stats.map(stat => (
									<MotionItem key={stat}>
										<span className='inline-flex rounded-full bg-white px-3 py-2 text-[12px] font-bold text-[#111827] shadow-xs ring-1 ring-red-100 transition-colors duration-300 hover:bg-red-50'>
											{stat}
										</span>
									</MotionItem>
								))}
							</MotionStagger>
						</div>
					</div>
				</MotionReveal>
				<MotionReveal className='relative mx-auto min-h-[420px] w-full max-w-[580px] sm:min-h-[560px] lg:min-h-[640px]' direction='right'>
					<div className='absolute left-[12%] top-[8%] h-[320px] w-[320px] sm:h-[430px] sm:w-[430px] lg:h-[470px] lg:w-[470px] rounded-full bg-white/75 blur-2xl' />
					<Image src='/images/miniapp/user-benefit-phone.png' alt='Giao diện Trạm Z' width={303} height={616} className='floating-slow absolute left-[2%] top-[7%] z-30 w-[205px] max-w-[54%] sm:w-[255px] lg:w-[285px] drop-shadow-xs' />
					<Image src='/images/miniapp/points-card-3.png' alt='Thẻ trải nghiệm Chợ Z' width={286} height={381} className='floating-fast absolute right-[18%] top-[30%] z-20 w-[188px] max-w-[50%] sm:w-[235px] lg:w-[260px] drop-shadow-xs' />
					<Image src='/images/miniapp/points-card-2.png' alt='Thẻ điểm nhận Chợ Z' width={286} height={381} className='floating-slow absolute right-[2%] top-[20%] z-10 w-[188px] max-w-[50%] sm:w-[235px] lg:w-[260px] drop-shadow-xs' />
				</MotionReveal>
			</div>
		</section>
	);
}
