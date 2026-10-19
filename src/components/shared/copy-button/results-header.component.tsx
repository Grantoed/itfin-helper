import React from 'react';
import CopyButton from './copy-button.component';
import * as copyStyles from './copy-button.module.scss';
import * as styles from './results-header.module.scss';

type Props = {
	children: React.ReactNode;
	copyText?: string;
	// Adds a toggle between the list and its markdown text
	markdown?: { shown: boolean; onToggle: () => void };
};

// Title row above a result list, with a one-click copy of the list
const ResultsHeader = ({ children, copyText, markdown }: Props) => (
	<div className={styles.resultsHeader}>
		<span className={styles.title}>{children}</span>
		<span className={styles.actions}>
			{markdown && (
				<button
					type="button"
					className={copyStyles.copyButton}
					aria-pressed={markdown.shown}
					onClick={markdown.onToggle}
				>
					Markdown
				</button>
			)}
			{copyText ? <CopyButton text={copyText} /> : null}
		</span>
	</div>
);

export default ResultsHeader;
