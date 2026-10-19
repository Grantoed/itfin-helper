import React, { useEffect, useState } from 'react';
import Button from '../button/button.component';
import { ButtonType } from '../button/button.types';
import { formatTimestamp } from '../../../utils/date.utils';
import * as styles from './task-status.module.scss';

type ActionsProps = {
	fetchLabel: string;
	loading: boolean;
	disabled?: boolean;
	canClear: boolean;
	onFetch: () => void;
	onCancel: () => void;
	onClear: () => void;
};

// Fetch button plus a secondary Cancel (while loading) or Clear button
export const TaskActions = ({
	fetchLabel,
	loading,
	disabled,
	canClear,
	onFetch,
	onCancel,
	onClear,
}: ActionsProps) => (
	<div className={styles.actions}>
		<Button
			onClick={onFetch}
			disabled={disabled || loading}
			aria-busy={loading}
			additionalProps={{
				btnType: ButtonType.TEXT,
				text: loading ? 'Fetching…' : fetchLabel,
			}}
		/>
		{(loading || canClear) && (
			<Button
				onClick={loading ? onCancel : onClear}
				variant="secondary"
				additionalProps={{
					btnType: ButtonType.TEXT,
					text: loading ? 'Cancel' : 'Clear',
				}}
			/>
		)}
	</div>
);

const formatElapsed = (ms: number) => {
	const seconds = Math.max(0, Math.floor(ms / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

// Ticking "m:ss" since startedAt; ITFin requests can take minutes
const Elapsed = ({ startedAt }: { startedAt: number }) => {
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);
	return (
		<span className={styles.elapsed} aria-hidden="true">
			{formatElapsed(now - startedAt)}
		</span>
	);
};

type StatusProps = {
	progress: string | null;
	error: string | null;
	startedAt?: number;
	fetchedAt?: number;
};

export const TaskStatus = ({
	progress,
	error,
	startedAt,
	fetchedAt,
}: StatusProps) => (
	<>
		<p className={styles.progress} aria-live="polite">
			{progress && (
				<>
					<span className={styles.spinner} aria-hidden="true" />
					{progress}
					{startedAt && <Elapsed startedAt={startedAt} />}
				</>
			)}
		</p>
		{error && (
			<p className={styles.error} role="alert">
				{error}
			</p>
		)}
		{!progress && fetchedAt && (
			<p className={styles.meta}>Fetched {formatTimestamp(fetchedAt)}</p>
		)}
	</>
);
