import { apiRequest } from '@/api/client';
import type {
  AnalyticsBillsResponse,
  AnalyticsCategoriesResponse,
  AnalyticsCategoryMonthsResponse,
  AnalyticsCurrenciesResponse,
  AnalyticsDailyResponse,
  AnalyticsPaceResponse,
  AnalyticsSummaryResponse,
  AnalyticsTrendResponse,
  IsoDate,
  TransactionType,
} from '@/types/api';

// GET /api/v1/analytics/* (D-042). The app always sends its own period, both dates, computed on
// the phone's calendar (D-025); month endpoints take "yyyy-MM".

export type Range = { from: IsoDate; to: IsoDate };

export const getAnalyticsSummary = ({ from, to }: Range) =>
  apiRequest<AnalyticsSummaryResponse>('/analytics/summary', { query: { from, to } });

export const getAnalyticsTrend = ({ from, to }: Range) =>
  apiRequest<AnalyticsTrendResponse>('/analytics/trend', { query: { from, to } });

export const getAnalyticsPace = (month: string) =>
  apiRequest<AnalyticsPaceResponse>('/analytics/pace', { query: { month } });

export const getAnalyticsCategories = ({ from, to }: Range, type: TransactionType) =>
  apiRequest<AnalyticsCategoriesResponse>('/analytics/categories', { query: { from, to, type } });

export const getAnalyticsCategoryMonths = ({ from, to }: Range) =>
  apiRequest<AnalyticsCategoryMonthsResponse>('/analytics/categories/monthly', { query: { from, to } });

export const getAnalyticsDaily = (month: string) =>
  apiRequest<AnalyticsDailyResponse>('/analytics/daily', { query: { month } });

export const getAnalyticsBills = ({ from, to }: Range) =>
  apiRequest<AnalyticsBillsResponse>('/analytics/bills', { query: { from, to } });

export const getAnalyticsCurrencies = ({ from, to }: Range, type: TransactionType) =>
  apiRequest<AnalyticsCurrenciesResponse>('/analytics/currencies', { query: { from, to, type } });
