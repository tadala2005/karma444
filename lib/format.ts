export const money = (amount: number) => `MK ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
export const dateLabel = (d: string | Date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Blantyre' }).format(new Date(d));
export const timeLabel = (d: string | Date) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Blantyre' }).format(new Date(d));
export const slugify = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
