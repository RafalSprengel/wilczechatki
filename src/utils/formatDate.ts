import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function formatDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  return dayjs.utc(dateString).format('DD.MM.YYYY');
}
