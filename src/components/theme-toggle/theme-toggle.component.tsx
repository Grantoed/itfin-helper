import React, { useEffect } from 'react';
import { PREF_KEYS } from '../../shared/constants';
import { setStorageValue, useStorageValue } from '../../utils/store.util';
import { applyTheme, resolveTheme, Theme } from '../../utils/theme.util';
import * as styles from './theme-toggle.module.scss';

// ITFin's "Night mode" switch
const ThemeToggle = () => {
	const theme = resolveTheme(useStorageValue<Theme>(PREF_KEYS.THEME));
	const nightMode = theme === 'dark';

	useEffect(() => applyTheme(theme), [theme]);

	return (
		<button
			type="button"
			role="switch"
			aria-checked={nightMode}
			className={styles.toggle}
			onClick={() =>
				setStorageValue(PREF_KEYS.THEME, nightMode ? 'light' : 'dark')
			}
		>
			Night mode
			<span className={styles.track} aria-hidden="true">
				<span className={styles.thumb} />
			</span>
		</button>
	);
};

export default ThemeToggle;
