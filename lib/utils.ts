// Utility functions for the app

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatMonthYear = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

// Error logging utility (can be replaced with proper logging service in production)
export const logError = (context: string, error: unknown) => {
  // Only log in development mode
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(`[${context}]`, error);
  }
  // In production, you could send to error tracking service
  // e.g., Sentry.captureException(error, { tags: { context } });
};

