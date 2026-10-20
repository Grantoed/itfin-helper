import {
	calculateIncomeProgress,
	formatPercent,
	formatWorkingDaysPercent,
	formatUsd,
	parseAmount,
} from './income.utils';

describe('calculateIncomeProgress', () => {
	const workingDays = { passed: 12, total: 22, until: '2026-10-16' };

	it('derives expected earned income and progress from planned income', () => {
		const result = calculateIncomeProgress(220_000, 132_000, workingDays);
		expect(result.workingDaysRatio).toBeCloseTo(12 / 22);
		expect(result.expected).toBeCloseTo(120_000);
		expect(result.progressRatio).toBeCloseTo(1.1);
	});

	it('has no progress ratio without a planned income', () => {
		expect(
			calculateIncomeProgress(0, 50_000, workingDays).progressRatio
		).toBeNull();
	});
});

describe('parseAmount', () => {
	it.each([
		['120000', 120000],
		['120,000', 120000],
		['120.000', 120000],
		['1,200,000', 1200000],
		['1.200.000', 1200000],
		['120,000.50', 120000.5],
		['120.000,50', 120000.5],
		['150000,5', 150000.5],
		['150000,50', 150000.5],
		['150000.50', 150000.5],
		['1234,567', 1234567],
		['$120 000.50', 120000.5],
		['0,75', 0.75],
		['120000,', 120000],
		['', null],
		['abc', null],
		[',', null],
	])('parses %p', (input, expected) => {
		expect(parseAmount(input)).toBe(expected);
	});
});

describe('formatting', () => {
	it('formats percent and dollars', () => {
		expect(formatPercent(0.5454)).toBe('55%');
		expect(formatPercent(1.0977)).toBe('110%');
		expect(formatWorkingDaysPercent(12 / 22)).toBe('54.5%');
		expect(formatWorkingDaysPercent(11 / 22)).toBe('50%');
		expect(formatWorkingDaysPercent(1)).toBe('100%');
		expect(formatUsd(54545.45, 0)).toBe('$54,545');
		expect(formatUsd(1234.5)).toBe('$1,234.50');
	});
});
