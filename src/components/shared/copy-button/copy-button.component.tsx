import React, { useEffect, useRef, useState } from 'react';
import * as styles from './copy-button.module.scss';

type Props = {
	text: string;
	label?: string;
};

// One click copies `text`; the label confirms for two seconds
const CopyButton = ({ text, label = 'Copy' }: Props) => {
	const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
	const resetTimer = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => () => clearTimeout(resetTimer.current), []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setState('copied');
		} catch (err) {
			console.error('Failed to copy', err);
			setState('error');
		}
		clearTimeout(resetTimer.current);
		resetTimer.current = setTimeout(() => setState('idle'), 2000);
	};

	return (
		<button
			type="button"
			className={styles.copyButton}
			onClick={handleCopy}
			disabled={!text}
			aria-live="polite"
		>
			{state === 'copied'
				? 'Copied ✓'
				: state === 'error'
				? 'Copy failed'
				: label}
		</button>
	);
};

export default CopyButton;
