// Mirrors of the API's DTOs (api/Sparc.Api/Dto). JSON is camelCase; enums are camelCase
// strings (D-024); DateOnly travels as "YYYY-MM-DD", DateTime as ISO 8601 UTC.
// Decimals arrive as JSON numbers. They are display values only: the app never does
// arithmetic on money, it formats what the API computed.

export type TransactionType = 'income' | 'expense';
export type Currency = 'RSD' | 'EUR' | 'USD';
export type IsoDate = string; // "2026-10-31"

export type TokenResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  preferredCurrency: Currency;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  preferredCurrency: Currency;
};

export type LoginRequest = { login: string; password: string };

export type CategoryResponse = {
  id: string;
  name: string;
  kind: TransactionType;
  isSystem: boolean;
};

export type TransactionRequest = {
  type: TransactionType;
  amount: number;
  currency: Currency;
  categoryId: string;
  occurredOn: IsoDate;
  description: string | null;
};

export type TransactionResponse = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  rateToRsd: number;
  amountRsd: number;
  categoryId: string | null;
  categoryName: string | null;
  occurredOn: IsoDate;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A recurring bill (D-034). `monthly: false` is a one-off bill, due once on firstDueDate. */
export type BillRequest = {
  name: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  firstDueDate: IsoDate;
  monthly: boolean;
};

export type BillResponse = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  categoryId: string | null;
  categoryName: string | null;
  firstDueDate: IsoDate;
  monthly: boolean;
  /** The earliest unpaid due date; in the past when overdue, null when nothing is left to pay. */
  nextDueDate: IsoDate | null;
  createdAt: string;
  updatedAt: string;
};

/** One month of a bill. Overdue is not a status: pending with a due date before today. */
export type OccurrenceStatus = 'pending' | 'paid';

export type OccurrenceResponse = {
  id: string;
  billId: string;
  billName: string;
  categoryId: string | null;
  categoryName: string | null;
  dueDate: IsoDate;
  status: OccurrenceStatus;
  /** The month's own amount, fixed when it was generated. */
  amount: number;
  currency: Currency;
  paidAt: string | null;
  /** The expense the payment created; null while pending. */
  transactionId: string | null;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type DashboardSummaryResponse = {
  from: IsoDate;
  to: IsoDate;
  currency: Currency;
  totalIncome: number;
  totalExpense: number;
  difference: number;
};
