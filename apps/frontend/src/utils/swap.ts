import type { Item, SwapOffer } from '../types';

// Предмет «выбыл» из обмена, если он ещё связан с оффером, но его статус больше
// не 'active' — лот ушёл в архив после сделки, отправлен на модерацию или отклонён.
// Отсутствующий предмет (null/undefined) «выбывшим» не считается: на его месте в
// карточке оффера показывается заглушка.
export function isItemInactive(item: Item | null | undefined): boolean {
  return item !== null && item !== undefined && item.status !== 'active';
}

// Ожидающий оффер с выбывшим предметом завершить нельзя: на фронте такая карточка
// приглушается и подписывается «Предмет больше не активен».
export function isStaleOffer(offer: SwapOffer): boolean {
  if (offer.status !== 'pending') return false;
  return isItemInactive(offer.offered_item) || isItemInactive(offer.target_item);
}

// «Активный» оффер — ожидающий ответа и пригодный к действию: оба предмета живы.
// Именно такие предложения показываем в разделе «Свопы» первыми.
export function isActiveOffer(offer: SwapOffer): boolean {
  return offer.status === 'pending' && !isStaleOffer(offer);
}

// Порядок карточек в списке «Свопы» (чем меньше число — тем выше карточка):
//   0 — активные (ожидают ответа, предметы живы);
//   1 — завершённые (принятые / отклонённые);
//   2 — «выбывшие» — приглушённая карточка «Предмет больше не активен». Уводим их
//       в самый низ: завершить такую сделку нельзя, в отличие от принятой, где ещё
//       есть кнопка «Связаться».
export function offerSortRank(offer: SwapOffer): number {
  if (isActiveOffer(offer)) return 0;
  if (isStaleOffer(offer)) return 2;
  return 1;
}
