import React from 'react';
import { ITFIN_ORIGIN } from '../../shared/constants';
import * as styles from './header.module.scss';

type Props = {
	isAuthed: boolean;
};

const Header = ({ isAuthed }: Props) => (
	<header className={styles.header}>
		<div className={styles.titleRow}>
			<h1 className={styles.heading}>ITFin Helper</h1>
			<span
				className={`${styles.statusChip} ${
					isAuthed ? styles.statusChipSuccess : styles.statusChipWarning
				}`}
			>
				{isAuthed ? 'Signed in' : 'Not signed in'}
			</span>
		</div>
		{!isAuthed && (
			<p className={styles.subheading}>
				Log in to{' '}
				<a
					className={styles.link}
					href={ITFIN_ORIGIN}
					target="_blank"
					rel="noreferrer"
				>
					ITFin
				</a>
				, then reopen this popup.
			</p>
		)}
	</header>
);

export default Header;
