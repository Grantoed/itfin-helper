import type { WorkingDays } from './date.utils';

export type IncomeProgress = {
	workingDaysRatio: number;
	expected: number;
	progressRatio: number | null;
};

// Monthly generated income figures for the weekly delivery meeting:
// expected earned = planned × working days progress; progress = income /
// expected earned.
export const calculateIncomeProgress = (
	planned: number,
	income: number,
	{ passed, total }: WorkingDays
): IncomeProgress => {
	const workingDaysRatio = total > 0 ? passed / total : 0;
	const expected = planned * workingDaysRatio;
	return {
		workingDaysRatio,
		expected,
		progressRatio: expected > 0 ? income / expected : null,
	};
};

// Accepts dots and commas as either separator: '120,000.50', '120.000,50',
// '150000,5', '1 200 000', '$120000'. The last separator is the decimal
// point when both kinds appear; a lone separator followed by exactly three
// digits ('120,000') separates thousands.
export const parseAmount = (value: string): number | null => {
	const cleaned = value.replace(/[^\d.,]/g, '');
	if (!/\d/.test(cleaned)) return null;

	const separators = cleaned.match(/[.,]/g) ?? [];
	const lastIndex = Math.max(
		cleaned.lastIndexOf('.'),
		cleaned.lastIndexOf(',')
	);
	const decimalsAfterLast = cleaned.length - lastIndex - 1;
	const hasDecimal =
		separators.length > 0 &&
		(new Set(separators).size > 1
			? true
			: separators.length === 1 && decimalsAfterLast !== 3);

	const normalized = hasDecimal
		? `${cleaned.slice(0, lastIndex).replace(/[.,]/g, '')}.${cleaned.slice(
				lastIndex + 1
		  )}`
		: cleaned.replace(/[.,]/g, '');
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amount : null;
};

// Rounded to at most `decimals` places: 0.54545 -> '54.5%', 0.5 -> '50%'
export const formatPercent = (ratio: number, decimals = 0) =>
	`${new Intl.NumberFormat('en-US', {
		maximumFractionDigits: decimals,
	}).format(ratio * 100)}%`;

// Working days progress is shown with one decimal: the calculations use the
// exact ratio, and a whole-number percentage wouldn't add up when checked
export const formatWorkingDaysPercent = (ratio: number) =>
	formatPercent(ratio, 1);

export const formatUsd = (value: number, fractionDigits = 2) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(value);
