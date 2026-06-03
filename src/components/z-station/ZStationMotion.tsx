'use client';

import { useRef, type ReactNode } from 'react';
import { motion, type MotionProps, type Variants, useInView, useReducedMotion } from 'framer-motion';

type RevealDirection = 'up' | 'left' | 'right' | 'none';

type MotionRevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	direction?: RevealDirection;
	amount?: number;
} & Omit<MotionProps, 'initial' | 'animate' | 'whileInView' | 'viewport'>;

function getHiddenState(direction: RevealDirection, prefersReducedMotion: boolean) {
	if (prefersReducedMotion || direction === 'none') return { opacity: 0 };

	if (direction === 'left') return { opacity: 0, x: -36, filter: 'blur(6px)' };
	if (direction === 'right') return { opacity: 0, x: 36, filter: 'blur(6px)' };

	return { opacity: 0, y: 28, filter: 'blur(6px)' };
}

export function MotionReveal({ children, className, delay = 0, direction = 'up', amount = 0.24, ...props }: MotionRevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, amount, margin: '0px 0px -8% 0px' });
	const prefersReducedMotion = useReducedMotion();
	const hiddenState = getHiddenState(direction, Boolean(prefersReducedMotion));
	const visibleState = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' };

	return (
		<motion.div
			ref={ref}
			className={className}
			initial={false}
			animate={isInView ? visibleState : hiddenState}
			transition={{ duration: prefersReducedMotion ? 0.2 : 0.62, ease: [0.22, 1, 0.36, 1], delay }}
			style={{ willChange: prefersReducedMotion ? 'opacity' : 'transform, opacity, filter' }}
			{...props}
		>
			{children}
		</motion.div>
	);
}

type MotionStaggerProps = {
	children: ReactNode;
	className?: string;
	staggerChildren?: number;
	amount?: number;
} & Omit<MotionProps, 'initial' | 'animate' | 'whileInView' | 'viewport' | 'variants'>;

const STAGGER_PARENT: Variants = {
	hidden: {},
	show: {},
};

export function MotionStagger({ children, className, staggerChildren = 0.07, amount = 0.18, ...props }: MotionStaggerProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, amount, margin: '0px 0px -8% 0px' });

	return (
		<motion.div
			ref={ref}
			className={className}
			variants={STAGGER_PARENT}
			initial={false}
			animate={isInView ? 'show' : 'hidden'}
			transition={{ staggerChildren, delayChildren: 0.04 }}
			{...props}
		>
			{children}
		</motion.div>
	);
}

type MotionItemProps = {
	children: ReactNode;
	className?: string;
} & Omit<MotionProps, 'variants' | 'transition'>;

const ITEM_VARIANTS: Variants = {
	hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
	show: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function MotionItem({ children, className, ...props }: MotionItemProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			variants={prefersReducedMotion ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : ITEM_VARIANTS}
			transition={{ duration: prefersReducedMotion ? 0.18 : 0.55, ease: [0.22, 1, 0.36, 1] }}
			style={{ willChange: prefersReducedMotion ? 'opacity' : 'transform, opacity, filter' }}
			{...props}
		>
			{children}
		</motion.div>
	);
}
