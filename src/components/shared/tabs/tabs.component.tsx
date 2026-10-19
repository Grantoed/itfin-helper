import React, { useRef } from 'react';
import * as styles from './tabs.module.scss';

export type TabStatus = 'loading' | 'error' | null;

export type Tab<T extends string> = {
	id: T;
	label: string;
	status?: TabStatus;
};

type Props<T extends string> = {
	tabs: Tab<T>[];
	value: T;
	onChange: (id: T) => void;
};

export const tabId = (id: string) => `tab-${id}`;
export const panelId = (id: string) => `panel-${id}`;

// Styled after ITFin's .itf-segmeneted-control; arrow keys move between tabs
const Tabs = <T extends string>({ tabs, value, onChange }: Props<T>) => {
	const refs = useRef<(HTMLButtonElement | null)[]>([]);

	const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
		const step =
			event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (!step) return;
		event.preventDefault();
		const next = (index + step + tabs.length) % tabs.length;
		onChange(tabs[next].id);
		refs.current[next]?.focus();
	};

	return (
		<div className={styles.tabs} role="tablist" aria-label="Sections">
			{tabs.map((tab, index) => {
				const selected = tab.id === value;
				return (
					<button
						key={tab.id}
						ref={element => (refs.current[index] = element)}
						type="button"
						role="tab"
						id={tabId(tab.id)}
						aria-selected={selected}
						aria-controls={panelId(tab.id)}
						tabIndex={selected ? 0 : -1}
						className={selected ? styles.selected : styles.tab}
						onClick={() => onChange(tab.id)}
						onKeyDown={event => handleKeyDown(event, index)}
					>
						{tab.label}
						{tab.status && (
							<span
								className={
									tab.status === 'error' ? styles.errorDot : styles.loadingDot
								}
								aria-label={
									tab.status === 'error' ? 'Last fetch failed' : 'Fetching'
								}
							/>
						)}
					</button>
				);
			})}
		</div>
	);
};

export default Tabs;
