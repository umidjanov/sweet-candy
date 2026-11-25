export type OrderLang = 'uz' | 'ru' | 'en';

export const ORDER_PROGRESS_STEPS = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
] as const;

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'pink'
  | 'outline';

export function getOrderStatusMeta(
  status: string,
  lang: OrderLang
): { label: string; shortLabel: string; variant: BadgeVariant } {
  const map: Record<
    string,
    {
      uz: [string, string];
      ru: [string, string];
      en: [string, string];
      variant: BadgeVariant;
    }
  > = {
    PENDING: {
      uz: ['Tasdiqlash kutilmoqda', 'Kutilmoqda'],
      ru: ['Ожидает подтверждения', 'Ожидает'],
      en: ['Pending confirmation', 'Pending'],
      variant: 'warning',
    },
    ACCEPTED: {
      uz: ['Qabul qilindi', 'Qabul qilindi'],
      ru: ['Принят кондитером', 'Принят'],
      en: ['Accepted', 'Accepted'],
      variant: 'info',
    },
    PREPARING: {
      uz: ['Tayyorlanmoqda', 'Tayyorlanmoqda'],
      ru: ['Готовится', 'Готовится'],
      en: ['Baking in progress', 'Preparing'],
      variant: 'pink',
    },
    READY: {
      uz: ['Tayyor', 'Tayyor'],
      ru: ['Готов', 'Готов'],
      en: ['Ready', 'Ready'],
      variant: 'success',
    },
    OUT_FOR_DELIVERY: {
      uz: ['Dastafka (Yo‘lda)', 'Dastafka'],
      ru: ['Доставляется', 'Доставка'],
      en: ['Out for delivery', 'Delivery'],
      variant: 'info',
    },
    COMPLETED: {
      uz: ['Topshirildi', 'Topshirildi'],
      ru: ['Выполнен', 'Выполнен'],
      en: ['Completed', 'Completed'],
      variant: 'success',
    },
    REJECTED: {
      uz: ['Rad etildi', 'Rad etildi'],
      ru: ['Отклонён', 'Отклонён'],
      en: ['Declined', 'Declined'],
      variant: 'danger',
    },
    CANCELLED: {
      uz: ['Bekor qilindi', 'Bekor qilindi'],
      ru: ['Отменён', 'Отменён'],
      en: ['Cancelled', 'Cancelled'],
      variant: 'outline',
    },
  };

  const entry = map[status];
  if (!entry) {
    return { label: status, shortLabel: status, variant: 'default' };
  }

  const pair = entry[lang] || entry.uz;
  return {
    label: pair[0],
    shortLabel: pair[1],
    variant: entry.variant,
  };
}

