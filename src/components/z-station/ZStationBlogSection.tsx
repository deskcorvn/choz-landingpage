import type { Post } from '@/payload-types';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MotionItem, MotionReveal, MotionStagger } from './ZStationMotion';
import { blogPosts } from './z-station-data';

const staticFallbacks = [
	'/choz-og.png',
	'/choz-og.png',
	'/choz-og.png',
];

export default function ZStationBlogSection({ posts }: { posts?: Post[] }) {
	// Fallback to static mock blog posts if no database posts are available
	const displayPosts = posts && posts.length > 0 ? posts : null;

	return (
		<section className='miniapp-section bg-white'>
			<div className='miniapp-container'>
				<MotionReveal className='mx-auto max-w-[740px] text-center'>
					<p className='text-[13px] font-bold uppercase tracking-[0.22em] text-[#b91c1c]'>Z Journal</p>
					<h2 className='miniapp-title mt-4'>Tìm hiểu thêm về Chợ Z</h2>
					<p className='miniapp-copy mt-4'>Các nội dung trọng tâm từ tài liệu giới thiệu dự án và tinh thần Kiểu Z.</p>
				</MotionReveal>

				{displayPosts ? (
					<MotionStagger className='mt-10 grid gap-5 sm:mt-12 sm:gap-7 lg:grid-cols-3'>
						{displayPosts.map((post, index) => {
							const imageUrl =
								post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage && post.heroImage.url
									? post.heroImage.url
									: staticFallbacks[index % staticFallbacks.length];

							const categoryLabel =
								post.categories &&
								post.categories[0] &&
								typeof post.categories[0] === 'object' &&
								'title' in post.categories[0] &&
								post.categories[0].title
									? post.categories[0].title
									: 'Chợ Z';

							return (
								<MotionItem key={post.id}>
									<Link
										href={`/posts/${post.slug}`}
										className='group block h-full overflow-hidden rounded-[24px] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_62px_rgba(127,29,29,0.14)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c] sm:rounded-[28px]'
									>
										<div className='relative h-[220px] overflow-hidden bg-slate-100 sm:h-[245px]'>
											<Image
												src={imageUrl}
												alt={post.title}
												fill
												sizes='(min-width: 1024px) 353px, 100vw'
												className='object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
											/>
											<div className='absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/28 to-transparent' />
										</div>
										<div className='flex min-h-[185px] flex-col p-5 sm:min-h-[205px] sm:p-7'>
											<div className='flex items-center gap-3 text-[13px] font-semibold text-slate-500'>
												<span className='h-px w-7 bg-[#b91c1c]' />
												<span>{categoryLabel}</span>
											</div>
											<h3 className='mt-4 text-[21px] font-extrabold leading-[1.38] tracking-[-0.01em] text-[#111827]'>
												{post.title}
											</h3>
											<span className='mt-auto inline-flex items-center gap-2 pt-8 text-[14px] font-bold text-[#7f1d1d] transition-colors duration-300 group-hover:text-[#b91c1c]'>
												Đọc thêm
												<ArrowRight className='size-4' />
											</span>
										</div>
									</Link>
								</MotionItem>
							);
						})}
					</MotionStagger>
				) : (
					<MotionStagger className='mt-10 grid gap-5 sm:mt-12 sm:gap-7 lg:grid-cols-3'>
						{blogPosts.map((post, index) => (
							<MotionItem key={post.title}>
								<Link
									href='#home'
									className='group block h-full overflow-hidden rounded-[24px] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_62px_rgba(127,29,29,0.14)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c] sm:rounded-[28px]'
								>
									<div className='relative h-[220px] overflow-hidden bg-slate-100 sm:h-[245px]'>
										<Image
											src={post.image}
											alt={post.title}
											fill
											sizes='(min-width: 1024px) 353px, 100vw'
											className='object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
										/>
										<div className='absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/28 to-transparent' />
									</div>
									<div className='flex min-h-[185px] flex-col p-5 sm:min-h-[205px] sm:p-7'>
										<div className='flex items-center gap-3 text-[13px] font-semibold text-slate-500'>
											<span className='h-px w-7 bg-[#b91c1c]' />
											<span>Chợ Z</span>
										</div>
										<h3 className='mt-4 text-[21px] font-extrabold leading-[1.38] tracking-[-0.01em] text-[#111827]'>
											{post.title}
										</h3>
										<span className='mt-auto inline-flex items-center gap-2 pt-8 text-[14px] font-bold text-[#7f1d1d] transition-colors duration-300 group-hover:text-[#b91c1c]'>
											Đọc thêm
											<ArrowRight className='size-4' />
										</span>
									</div>
								</Link>
							</MotionItem>
						))}
					</MotionStagger>
				)}
			</div>
		</section>
	);
}

