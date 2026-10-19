import React from 'react';
import { CACHE_KEYS, ITFIN_ORIGIN } from '../../shared/constants';
import { useStorageValue } from '../../utils/store.util';
import ThemeToggle from '../theme-toggle/theme-toggle.component';
import * as styles from './header.module.scss';

type Props = {
	isAuthed: boolean;
};

const Header = ({ isAuthed }: Props) => {
	// Having the cookie isn't enough: ITFin may have rejected the session
	const expired = useStorageValue<boolean>(CACHE_KEYS.SESSION_EXPIRED) === true;
	const signedIn = isAuthed && !expired;
	const status = !isAuthed
		? 'Not signed in'
		: expired
		? 'Session expired'
		: 'Signed in';

	return (
		<header className={styles.header}>
			<div className={styles.titleRow}>
				<h1 className={styles.heading}>ITFin Helper</h1>
				<span className={styles.headerActions}>
					<ThemeToggle />
					<span
						className={`${styles.statusChip} ${
							signedIn ? styles.statusChipSuccess : styles.statusChipWarning
						}`}
						role="status"
					>
						{status}
					</span>
				</span>
			</div>
			{!signedIn && (
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
					{expired ? ' again' : ''}, then reopen this popup.
				</p>
			)}
		</header>
	);
};

export default Header;
