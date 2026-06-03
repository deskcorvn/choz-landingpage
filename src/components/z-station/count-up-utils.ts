export function formatCountUpValue(value: number, suffix = '') {
	return value.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + suffix;
}

export function getCountUpFrameValue(target: number, progress: number, decimals = 0) {
	const boundedProgress = Math.min(Math.max(progress, 0), 1);
	const easedProgress = 1 - Math.pow(1 - boundedProgress, 3);
	const value = target * easedProgress;
	const multiplier = 10 ** decimals;

	return Math.round(value * multiplier) / multiplier;
}
