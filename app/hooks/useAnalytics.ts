import { useQuery } from '@tanstack/react-query';

import {
  getAnalyticsBills,
  getAnalyticsCategories,
  getAnalyticsCategoryMonths,
  getAnalyticsCurrencies,
  getAnalyticsDaily,
  getAnalyticsPace,
  getAnalyticsSummary,
  getAnalyticsTrend,
  type Range,
} from '@/api/analytics';
import type { TransactionType } from '@/types/api';

// One query per card, so each card loads and fails on its own. Every key starts with
// ['analytics'], which any money write and a display-currency switch invalidate.

export const useAnalyticsSummary = (range: Range) =>
  useQuery({ queryKey: ['analytics', 'summary', range.from, range.to], queryFn: () => getAnalyticsSummary(range) });

export const useAnalyticsTrend = (range: Range) =>
  useQuery({ queryKey: ['analytics', 'trend', range.from, range.to], queryFn: () => getAnalyticsTrend(range) });

export const useAnalyticsPace = (month: string) =>
  useQuery({ queryKey: ['analytics', 'pace', month], queryFn: () => getAnalyticsPace(month) });

export const useAnalyticsCategories = (range: Range, type: TransactionType) =>
  useQuery({
    queryKey: ['analytics', 'categories', range.from, range.to, type],
    queryFn: () => getAnalyticsCategories(range, type),
  });

export const useAnalyticsCategoryMonths = (range: Range) =>
  useQuery({
    queryKey: ['analytics', 'categories-monthly', range.from, range.to],
    queryFn: () => getAnalyticsCategoryMonths(range),
  });

export const useAnalyticsDaily = (month: string) =>
  useQuery({ queryKey: ['analytics', 'daily', month], queryFn: () => getAnalyticsDaily(month) });

export const useAnalyticsBills = (range: Range) =>
  useQuery({ queryKey: ['analytics', 'bills', range.from, range.to], queryFn: () => getAnalyticsBills(range) });

export const useAnalyticsCurrencies = (range: Range, type: TransactionType) =>
  useQuery({
    queryKey: ['analytics', 'currencies', range.from, range.to, type],
    queryFn: () => getAnalyticsCurrencies(range, type),
  });
