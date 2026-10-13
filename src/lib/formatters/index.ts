// Utility formatters for Indonesian Locale, Currency, and Dates

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  // Use explicit formatting with standard dot separator to prevent ICU non-breaking space mismatch between Node.js and browser
  const formattedNumber = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formattedNumber}`;
}

export function formatNumberDot(val: number | string | ''): string {
  if (val === '' || val === undefined || val === null) return '';
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseNumberDot(val: string): number {
  const clean = val.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr: string): string {
  if (!dateTimeStr) return '-';
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return dateTimeStr;
  }
}

export function formatTime24h(dateTimeStr?: string): string {
  if (!dateTimeStr) return '-';
  try {
    // If it's already HH:mm or HH:mm:ss
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(dateTimeStr)) {
      return dateTimeStr.slice(0, 5);
    }
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return dateTimeStr;
  }
}

export function formatDurationMinutes(minutes?: number): string {
  if (!minutes || minutes <= 0) return '0 jam 0 mnt';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} jam ${remainingMinutes} mnt`;
}

export function getTodayDateStr(): string {
  // Deterministic seed simulation date for prototype SSR prerender
  if (typeof window === 'undefined') {
    return '2026-10-12';
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
