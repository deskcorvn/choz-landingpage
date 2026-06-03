import Link from 'next/link';
import type { ReactNode } from 'react';

export default function HeaderCta({ href, children }: { href: string; children: ReactNode }) {
	return (
		<Link href={href} className='inline-flex h-12 items-center rounded-full bg-[#b91c1c] px-6 text-[14px] font-bold text-white transition-colors duration-300 hover:bg-[#991b1b] sm:h-14 sm:px-8'>
			{children}
		</Link>
	);
}
