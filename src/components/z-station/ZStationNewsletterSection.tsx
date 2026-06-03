import LeadCaptureForm from './LeadCaptureForm';
import { MotionReveal } from './ZStationMotion';

export default function ZStationNewsletterSection() {
	return (
		<section
			id='newsletter-email'
			className='relative left-1/2 w-screen -translate-x-1/2 scroll-mt-28 overflow-hidden bg-white py-16 lg:py-20'
		>
			<div className='miniapp-container relative'>
				<div className='grid gap-8 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14'>
					<MotionReveal className='max-w-155 text-left' direction='left'>
						<p className='text-[12px] font-black uppercase tracking-[0.24em] text-[#9f1d1d]'>Hợp tác cùng Chợ Z</p>
						<h2 className='mt-4 text-[32px] font-bold leading-[42px] tracking-[-0.035em] text-stone-950 sm:mt-5 sm:text-[42px] sm:leading-13.5'>
							Mở kênh hợp tác D2C cùng mạng lưới Trạm Z
						</h2>
						<p className='mt-4 max-w-140 text-[16px] leading-7.25 text-stone-600'>
							Dành cho nhà cung cấp sản phẩm, dịch vụ, logistics hoặc đối tác vận hành Trạm muốn cùng Chợ Z mở rộng kênh bán trực tiếp.
						</p>
					</MotionReveal>

					<MotionReveal direction='right' className='transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-[0_22px_48px_rgba(127,29,29,0.12)]'>
						<LeadCaptureForm
							tenantSlug='z-station'
							leadSource='z_station_landing'
							theme='zStation'
							submitLabel='GỬI THÔNG TIN HỢP TÁC'
							submittingLabel='ĐANG GỬI…'
							successMessage='Gửi thành công! Chợ Z sẽ liên hệ trao đổi hợp tác.'
							showInlineSuccess
							showBottomHelperText
						/>
					</MotionReveal>
				</div>
			</div>
		</section>
	);
}
