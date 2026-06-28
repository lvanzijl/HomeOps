import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

interface VisualReviewMarketingTimeResponse {
  anchorUtc?: string | null;
}

export function useVisualReviewNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`${apiBaseUrl}/api/visual-review-fixtures/marketing-time`, { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() as Promise<VisualReviewMarketingTimeResponse> : null)
      .then((time) => {
        if (!ignore && time?.anchorUtc) setNow(new Date(time.anchorUtc));
      })
      .catch(() => undefined);
    return () => { ignore = true; };
  }, []);

  return now;
}

export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}
