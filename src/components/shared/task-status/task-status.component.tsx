import React from 'react';
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
				text: loading ? 'Fetching...' : fetchLabel,
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

type StatusProps = {
	progress: string | null;
	error: string | null;
	fetchedAt?: number;
};

export const TaskStatus = ({ progress, error, fetchedAt }: StatusProps) => (
	<>
		<p className={styles.progress} aria-live="polite">
			{progress && (
				<>
					<span className={styles.spinner} aria-hidden="true" />
					{progress}
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
