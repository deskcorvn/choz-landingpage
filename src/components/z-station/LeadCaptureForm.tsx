'use client';

import React, { useId, useMemo, useState } from 'react';

type LeadCaptureTheme = 'orange' | 'rose' | 'lotusBlue' | 'zStation';

type LeadCaptureFormProps = {
	tenantSlug?: string;
	leadSource?: string;
	submitLabel?: string;
	submittingLabel?: string;
	showInlineSuccess?: boolean;
	showBottomHelperText?: boolean;
	successMessage?: string;
	onSuccess?: (payload: any) => void;
	headerSlot?: React.ReactNode;
	accentColor?: '#ff7b00' | '#d91636' | '#0284c7';
	theme?: LeadCaptureTheme;
};

type FormErrors = {
	name?: string;
	phone?: string;
	email?: string;
};

// Pure helper validation functions
const isFullName = (name: string) => name.trim().split(/\s+/).length >= 2;
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizePhone = (phone: string) => phone.replace(/\s+/g, '');

export default function LeadCaptureForm({
	tenantSlug,
	leadSource,
	submitLabel = 'ĐĂNG KÝ TƯ VẤN',
	submittingLabel = 'ĐANG GỬI...',
	showInlineSuccess = true,
	showBottomHelperText = true,
	successMessage = 'Gửi thành công! Cảm ơn bạn đã đăng ký.',
	onSuccess,
	headerSlot,
	accentColor = '#ff7b00',
	theme,
}: LeadCaptureFormProps) {
	const uid = useId();
	const nameId = useMemo(() => `name-${uid}`, [uid]);
	const phoneId = useMemo(() => `phone-${uid}`, [uid]);
	const emailId = useMemo(() => `email-${uid}`, [uid]);
	const successId = useMemo(() => `success-${uid}`, [uid]);

	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const resolvedTheme =
		theme ?? (accentColor === '#0284c7' ? 'lotusBlue' : accentColor === '#d91636' ? 'rose' : 'orange');

	const themeClasses = {
		orange: {
			form: 'rounded-2xl bg-white/70 p-4 sm:p-5',
			glow: 'from-[#ff7b00]/10',
			label: 'text-slate-800',
			input: 'bg-white/95 ring-slate-200/85 focus:ring-[#ff7b00]/30',
			submit: 'bg-[#ff7b00] hover:bg-[#ff9a3d]',
			helper: 'text-slate-500',
		},
		rose: {
			form: 'rounded-2xl bg-white/70 p-4 sm:p-5',
			glow: 'from-[#d91636]/10',
			label: 'text-slate-800',
			input: 'bg-white/95 ring-slate-200/85 focus:ring-[#d91636]/30',
			submit: 'bg-[#d91636] hover:bg-[#b8122d]',
			helper: 'text-slate-500',
		},
		lotusBlue: {
			form: 'rounded-[1.5rem] border border-sky-100/80 bg-white/82 p-4 shadow-[0_22px_70px_rgba(2,132,199,0.14)] backdrop-blur-sm sm:p-5',
			glow: 'from-[#0284c7]/16',
			label: 'text-slate-700',
			input: 'bg-white/95 ring-sky-100/90 focus:ring-[#0284c7]/30',
			submit: 'bg-[#075985] hover:bg-[#0284c7]',
			helper: 'text-slate-500',
		},
		zStation: {
			form: 'overflow-hidden rounded-2xl border border-white/20 bg-white/92 p-4 shadow-[0_8px_20px_rgba(127,29,29,0.2)] backdrop-blur-sm sm:p-5',
			glow: '',
			label: 'text-[#7f1d1d]',
			input: 'bg-white/95 ring-red-100 focus:ring-[#b91c1c]/30',
			submit: 'bg-[#b91c1c] hover:bg-[#991b1b]',
			helper: 'text-[#6b7280]',
		},
	} satisfies Record<LeadCaptureTheme, Record<'form' | 'glow' | 'label' | 'input' | 'submit' | 'helper', string>>;

	const activeTheme = themeClasses[resolvedTheme];
	const showSubmitShine = resolvedTheme !== 'zStation';

	function validate(nextName: string, nextPhone: string, nextEmail: string): FormErrors {
		const nextErrors: FormErrors = {};
		if (!isFullName(nextName)) nextErrors.name = 'Vui lòng nhập đủ họ và tên';
		if (normalizePhone(nextPhone).length < 9) {
			nextErrors.phone = 'Số điện thoại chưa hợp lệ (tối thiểu 9 chữ số).';
		}
		if (!isValidEmail(nextEmail)) nextErrors.email = 'Email chưa hợp lệ.';
		return nextErrors;
	}

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (isSubmitting) return;

		setIsSuccess(false);
		setSubmitError(null);
		const nextErrors = validate(name, phone, email);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		const source = leadSource?.trim() || 'z_station_landing';

		setIsSubmitting(true);
		try {
			// POST directly to our Payload CMS leads collection REST endpoint
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: name.trim(),
					phone: normalizePhone(phone),
					email: email.trim(),
					source,
				}),
			});

			if (!res.ok) {
				throw new Error('Gửi thông tin thất bại. Vui lòng thử lại sau.');
			}

			const data = await res.json();

			setName('');
			setPhone('');
			setEmail('');
			setErrors({});
			setSubmitError(null);

			if (onSuccess) {
				onSuccess(data);
				return;
			}

			setIsSuccess(true);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Không gửi được. Vui lòng thử lại sau.';
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className={`relative ${activeTheme.form}`}>
			<div className={`pointer-events-none absolute inset-0 -z-10 bg-linear-to-br ${activeTheme.glow} via-transparent to-transparent`} />
			{headerSlot}

			<div className='grid gap-3 sm:grid-cols-2'>
				<div className='sm:col-span-1'>
					<label htmlFor={nameId} className={`mb-1 block text-sm font-semibold ${activeTheme.label}`}>
						Tên của bạn
					</label>
					<input
						id={nameId}
						name='name'
						value={name}
						onChange={e => setName(e.target.value)}
						autoComplete='name'
						required
						aria-invalid={errors.name ? true : undefined}
						aria-describedby={errors.name ? `${nameId}-err` : undefined}
						className={`h-11 w-full rounded-lg px-4 text-sm outline-hidden ring-1 transition focus:ring-2 ${activeTheme.input}`}
						placeholder='Ví dụ: Nguyễn Văn A'
					/>
					{errors.name ? (
						<p id={`${nameId}-err`} className='mt-1 text-xs font-semibold text-red-600' role='alert'>
							{errors.name}
						</p>
					) : null}
				</div>

				<div className='sm:col-span-1'>
					<label htmlFor={phoneId} className={`mb-1 block text-sm font-semibold ${activeTheme.label}`}>
						Số điện thoại
					</label>
					<input
						id={phoneId}
						name='phone'
						value={phone}
						onChange={e => setPhone(e.target.value)}
						autoComplete='tel'
						inputMode='tel'
						required
						aria-invalid={errors.phone ? true : undefined}
						aria-describedby={errors.phone ? `${phoneId}-err` : undefined}
						className={`h-11 w-full rounded-lg px-4 text-sm outline-hidden ring-1 transition focus:ring-2 ${activeTheme.input}`}
						placeholder='Ví dụ: 0901 234 567'
					/>
					{errors.phone ? (
						<p id={`${phoneId}-err`} className='mt-1 text-xs font-semibold text-red-600' role='alert'>
							{errors.phone}
						</p>
					) : null}
				</div>

				<div className='sm:col-span-2'>
					<label htmlFor={emailId} className={`mb-1 block text-sm font-semibold ${activeTheme.label}`}>
						Email
					</label>
					<input
						id={emailId}
						name='email'
						type='email'
						value={email}
						onChange={e => setEmail(e.target.value)}
						autoComplete='email'
						required
						aria-invalid={errors.email ? true : undefined}
						aria-describedby={errors.email ? `${emailId}-err` : undefined}
						className={`h-11 w-full rounded-lg px-4 text-sm outline-hidden ring-1 transition focus:ring-2 ${activeTheme.input}`}
						placeholder='Ví dụ: ban@email.com'
					/>
					{errors.email ? (
						<p id={`${emailId}-err`} className='mt-1 text-xs font-semibold text-red-600' role='alert'>
							{errors.email}
						</p>
					) : null}
				</div>

				<button
					type='submit'
					disabled={isSubmitting}
					aria-disabled={isSubmitting}
					className={`group relative mt-1 flex h-11 items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-semibold text-white shadow-xs transition disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 ${activeTheme.submit}`}
				>
					{showSubmitShine ? (
						<span className='pointer-events-none absolute inset-0 translate-x-[-120%] bg-white/20 transition-transform duration-500 group-hover:translate-x-[120%]' />
					) : null}
					{isSubmitting ? (
						<span className='relative inline-flex items-center gap-2'>
							<span className='h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white' />
							{submittingLabel}
						</span>
					) : (
						<span className='relative'>{submitLabel}</span>
					)}
				</button>

				{submitError ? (
					<p className='sm:col-span-2 text-xs font-semibold text-red-600' role='alert' aria-live='assertive'>
						{submitError}
					</p>
				) : null}
			</div>

			{showBottomHelperText ? (
				<div className='mt-3'>
					<p className={`text-xs font-semibold ${activeTheme.helper}`}>Chúng tôi sẽ liên hệ dựa trên thông tin bạn gửi.</p>
					{showInlineSuccess && isSuccess ? (
						<p
							id={successId}
							className='mt-2 inline-flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 ring-1 ring-green-200'
							role='status'
							aria-live='polite'
						>
							<span className='mt-0.5 inline-block h-2 w-2 rounded-full bg-green-500' />
							{successMessage}
						</p>
					) : null}
				</div>
			) : null}
		</form>
	);
}
