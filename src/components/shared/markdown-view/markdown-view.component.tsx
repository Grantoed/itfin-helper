import React, { useEffect, useRef, useState } from 'react';
import * as styles from './markdown-view.module.scss';

type Props = {
	text: string;
};

const MarkdownView = ({ text }: Props) => {
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
		'idle'
	);
	const resetTimer = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => () => clearTimeout(resetTimer.current), []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopyState('copied');
		} catch (err) {
			console.error('Failed to copy markdown', err);
			setCopyState('error');
		}
		clearTimeout(resetTimer.current);
		resetTimer.current = setTimeout(() => setCopyState('idle'), 2000);
	};

	return (
		<div className={styles.markdownContainer}>
			<div className={styles.markdownActions}>
				<span className={styles.markdownHint}>Copy-friendly markdown list</span>
				<button
					type="button"
					className={styles.copyButton}
					onClick={handleCopy}
					disabled={!text}
					aria-live="polite"
				>
					{copyState === 'copied'
						? 'Copied!'
						: copyState === 'error'
						? 'Copy failed'
						: 'Copy'}
				</button>
			</div>
			<textarea
				className={styles.markdownTextarea}
				readOnly
				value={text}
				aria-label="Markdown list"
				onFocus={event => event.currentTarget.select()}
			/>
		</div>
	);
};

export default MarkdownView;
