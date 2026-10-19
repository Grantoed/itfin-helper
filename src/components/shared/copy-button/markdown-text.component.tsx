import React from 'react';
import * as styles from './results-header.module.scss';

type Props = {
	text: string;
	label: string;
};

const MarkdownText = ({ text, label }: Props) => (
	<textarea
		className={styles.markdown}
		readOnly
		value={text}
		aria-label={label}
		onFocus={event => event.currentTarget.select()}
	/>
);

export default MarkdownText;
