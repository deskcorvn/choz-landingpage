'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { navLinks } from './z-station-data';

export default function ZStationHeader() {
	const [hasPassedHero, setHasPassedHero] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const prefersReducedMotion = useReducedMotion();

	useEffect(() => {
		const hero = document.getElementById('home');
		const mobileQuery = window.matchMedia('(max-width: 1023px)');

		const updateHeaderVisibility = () => {
			if (!mobileQuery.matches) {
				setHasPassedHero(true);
				return;
			}

			setHasPassedHero(window.scrollY > (hero?.offsetHeight ?? window.innerHeight) - 80);
		};

		updateHeaderVisibility();
		window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
		window.addEventListener('resize', updateHeaderVisibility);
		mobileQuery.addEventListener('change', updateHeaderVisibility);

		return () => {
			window.removeEventListener('scroll', updateHeaderVisibility);
			window.removeEventListener('resize', updateHeaderVisibility);
			mobileQuery.removeEventListener('change', updateHeaderVisibility);
		};
	}, []);

	useEffect(() => {
		if (!isMenuOpen) return;

		const originalOverflow = document.body.style.overflow;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsMenuOpen(false);
		};

		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', closeOnEscape);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener('keydown', closeOnEscape);
		};
	}, [isMenuOpen]);

	const headerVisible = hasPassedHero || isMenuOpen;

	return (
		<>
			<header
				className={`fixed inset-x-0 top-3 z-50 transition-all duration-300 sm:top-4 lg:translate-y-0 lg:opacity-100 ${headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none lg:pointer-events-auto'}`}
			>
			<div className='miniapp-container'>
				<div className='flex items-center justify-between gap-2 rounded-full border border-red-100 bg-white/82 px-3 py-2 sm:gap-3 backdrop-blur-2xl supports-backdrop-filter:bg-white/76'>
					<Link
						href='/'
						className='group flex min-w-0 items-center gap-2 rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c] sm:gap-3'
						aria-label='Chợ Z'
						translate='no'
					>
						<Image src='/images/miniapp/logo.svg' alt='' width={44} height={44} className='h-9 w-9 shrink-0 sm:h-11 sm:w-11' />
						<span className='hidden min-w-0 lg:block'>
							<span className='block truncate text-sm font-black tracking-[-0.02em] text-[#1f2937]'>Chợ Z</span>
							<span className='block truncate text-[11px] font-semibold text-slate-500'>Kênh D2C từ gốc đến người dùng</span>
						</span>
					</Link>

					<nav className='hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex'>
						{navLinks.map(item => (
							<a
								key={item.href}
								href={item.href}
								className='relative -mb-px py-3 transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-linear-to-r after:from-[#7f1d1d] after:via-[#b91c1c] after:to-[#ef4444] after:transition-transform after:duration-500 after:ease-out hover:text-[#b91c1c] hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c]'
							>
								{item.label}
							</a>
						))}
					</nav>

					<div className='flex items-center gap-2 sm:gap-3'>
						<Link
							href='#hop-tac'
							className='hidden h-11 items-center rounded-full bg-[#7f1d1d] px-5 text-[13px] font-black text-white transition-colors duration-300 hover:bg-[#991b1b] sm:inline-flex'
						>
							KẾT NỐI HỢP TÁC
						</Link>
						<button
							type='button'
							aria-label='Mở menu'
							aria-expanded={isMenuOpen}
							aria-controls='z-station-mobile-menu'
							onClick={() => setIsMenuOpen(true)}
							className='grid size-10 place-items-center rounded-full bg-white text-[#111827] transition-colors duration-300 hover:bg-red-50 sm:size-11 xl:hidden'
						>
							<Menu className='size-5' />
						</button>
					</div>
				</div>
			</div>
		</header>

		<AnimatePresence>
				{isMenuOpen ? (
					<motion.div
						id='z-station-mobile-menu'
						className='fixed inset-0 z-60 flex min-h-dvh flex-col bg-white text-[#111827] lg:hidden'
						initial={prefersReducedMotion ? { opacity: 0 } : { x: '-100%' }}
						animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
						exit={prefersReducedMotion ? { opacity: 0 } : { x: '-100%' }}
						transition={{ duration: prefersReducedMotion ? 0.18 : 0.48, ease: [0.22, 1, 0.36, 1] }}
					>
						<div className='flex items-center justify-between gap-4 border-b border-red-100 px-5 py-4 sm:px-7'>
							<Link
								href='/'
								onClick={() => setIsMenuOpen(false)}
								className='flex min-w-0 items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c]'
								aria-label='Chợ Z'
								translate='no'
							>
								<Image src='/images/miniapp/logo.svg' alt='' width={48} height={48} className='size-12 shrink-0' />
								<span className='min-w-0'>
									<span className='block truncate text-lg font-black tracking-[-0.03em] text-[#7f1d1d]'>Chợ Z</span>
									<span className='block truncate text-xs font-semibold text-slate-500'>Kênh D2C từ gốc đến người dùng</span>
								</span>
							</Link>
							<button
								type='button'
								onClick={() => setIsMenuOpen(false)}
								aria-label='Đóng menu'
								className='grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-[#7f1d1d] transition-colors duration-300 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c]'
							>
								<X className='size-5' />
							</button>
						</div>

						<nav className='flex flex-1 flex-col justify-center px-6 py-8 sm:px-10' aria-label='Menu z-station mobile'>
							{navLinks.map((item, index) => (
								<div key={item.href} className='text-center'>
									<a
										href={item.href}
										onClick={() => setIsMenuOpen(false)}
										className='inline-flex rounded-full px-5 py-3 text-[24px] font-black tracking-[-0.035em] text-[#111827] transition-colors duration-300 hover:text-[#b91c1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c] sm:text-[30px]'
									>
										{item.label}
									</a>
									{index < navLinks.length - 1 ? <span className='mx-auto my-2 block h-px w-14 rounded-full bg-red-100 sm:my-3 sm:w-18' /> : null}
								</div>
							))}
						</nav>

						<div className='border-t border-red-100 px-5 py-5 sm:px-7'>
							<Link
								href='#hop-tac'
								onClick={() => setIsMenuOpen(false)}
								className='flex h-13 w-full items-center justify-center rounded-full bg-[#7f1d1d] px-6 text-[14px] font-black text-white transition-colors duration-300 hover:bg-[#991b1b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b91c1c]'
							>
								KẾT NỐI HỢP TÁC
							</Link>
						</div>
					</motion.div>
				) : null}
		</AnimatePresence>
		</>
	);
}
