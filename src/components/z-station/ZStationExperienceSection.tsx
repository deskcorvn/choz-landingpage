import Image from 'next/image';
import HeaderCta from './HeaderCta';
import { MotionItem, MotionReveal, MotionStagger } from './ZStationMotion';

export default function ZStationExperienceSection() {
	return (
		<section id='kieu-z' className='bg-white py-16 lg:py-20'>
			<div className='miniapp-container overflow-hidden text-[#111827] sm:rounded-[40px] sm:px-10 sm:py-12 lg:grid lg:min-h-[560px] lg:grid-cols-[1fr_0.88fr] lg:items-center lg:px-14 lg:py-0'>
				<MotionReveal className='relative z-10 max-w-[640px] text-center lg:text-left' direction='left'>
					<h2 className='text-[34px] font-bold leading-[45px] text-[#7f1d1d] sm:text-[40px] sm:leading-[56px]'>Kiểu Z là lối đi riêng để tạo giá trị xã hội mới</h2>
					<p className='mt-5 text-[16px] leading-[29px] text-[#4b5563]'>
						Tinh thần Kiểu Z trong tài liệu nhấn mạnh “lối đi riêng” và “giá trị xã hội mới mẻ”, thể hiện qua các gói công việc thực chiến như Món Z, Điểm Z đa năng và cơ chế góp vốn bằng công sức, trí tuệ, vật chất hoặc dữ liệu khách hàng.
					</p>
					<MotionStagger className='mt-6 grid gap-3 text-left sm:mt-7 sm:grid-cols-3 lg:max-w-[620px]'>
						{['Học kỹ năng gắn với việc thật', 'Làm thử để hiểu thị trường', 'Cùng góp sức tạo nghiệp khởi'].map(item => (
							<MotionItem key={item}>
								<div className='h-full rounded-2xl border border-red-100 bg-white p-4 text-sm font-semibold leading-6 text-[#111827] shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_16px_34px_rgba(127,29,29,0.10)]'>
									{item}
								</div>
							</MotionItem>
						))}
					</MotionStagger>
					<p className='mt-5 text-[15px] leading-[27px] text-[#6b7280]'>
						Điểm khác biệt nằm ở cách biến trải nghiệm học - làm - góp vốn thành một vòng phát triển chung: người tham gia có thu nhập, nhà cung cấp có kênh thử nghiệm, còn hệ sinh thái có thêm dữ liệu và điểm chạm thật.
					</p>
					<div className='mt-8 flex flex-wrap justify-center gap-4 lg:justify-start'>
						<HeaderCta href='#newsletter-email'>Kết nối Chợ Z</HeaderCta>
					</div>
				</MotionReveal>
				<MotionReveal className='relative mt-8 min-h-[420px] sm:mt-10 sm:min-h-[520px] lg:mt-0 lg:min-h-[640px]' direction='right'>
					<Image src='/images/miniapp/cta-phone-left.webp' alt='Giao diện Kiểu Z' width={373} height={779} className='floating-fast absolute bottom-6 left-[9%] z-10 w-[160px] sm:w-[206px] max-w-[43%] drop-shadow-xs lg:bottom-8 lg:w-[214px]' />
					<Image src='/images/miniapp/cta-phone-right.webp' alt='Giao diện Chợ Z' width={373} height={779} className='floating-slow absolute bottom-4 right-[7%] z-20 w-[190px] sm:w-[250px] max-w-[52%] drop-shadow-xs lg:bottom-6 lg:w-[260px]' />
				</MotionReveal>
			</div>
		</section>
	);
}
