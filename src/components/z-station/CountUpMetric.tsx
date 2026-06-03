'use client';

import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { formatCountUpValue, getCountUpFrameValue } from './count-up-utils';

type CountUpMetricProps = {
	value: number;
	suffix?: string;
	decimals?: number;
	start: boolean;
	duration?: number;
};

export default function CountUpMetric({ value, suffix = '', decimals = 0, start, duration = 1400 }: CountUpMetricProps) {
	const elementRef = useRef<HTMLSpanElement>(null);
	const progress = useMotionValue(0);
	const startedRef = useRef(false);
	const prefersReducedMotion = useReducedMotion();

	useEffect(() => {
		const node = elementRef.current;
		if (!node) return;

		const renderValue = (latest: number) => {
			node.textContent = formatCountUpValue(getCountUpFrameValue(value, latest, decimals), suffix);
		};

		renderValue(progress.get());
		return progress.on('change', renderValue);
	}, [decimals, progress, suffix, value]);

	useEffect(() => {
		if (!start || startedRef.current) return;

		startedRef.current = true;

		if (prefersReducedMotion) {
			progress.set(1);
			return;
		}

		const controls = animate(progress, 1, {
			duration: duration / 1000,
			ease: 'linear',
		});

		return () => controls.stop();
	}, [duration, prefersReducedMotion, progress, start]);

	return <span ref={elementRef}>{formatCountUpValue(0, suffix)}</span>;
}
