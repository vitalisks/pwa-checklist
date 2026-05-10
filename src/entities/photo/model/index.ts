export type { ChecklistPhoto } from '@/shared/config';

export const PHOTO_ID_PREFIXES = {
  TEMPLATE: 'tpl_',
  CHECKLIST: 'cl_',
} as const;

export function isTemplatePhoto(photoId: string): boolean {
  return photoId.startsWith(PHOTO_ID_PREFIXES.TEMPLATE);
}

export function isChecklistPhoto(photoId: string): boolean {
  return photoId.startsWith(PHOTO_ID_PREFIXES.CHECKLIST);
}

export function buildTemplatePhotoId(itemId: string, uuid: string): string {
  return `${PHOTO_ID_PREFIXES.TEMPLATE}${itemId}_${uuid}`;
}

export function buildChecklistPhotoId(itemId: string, uuid: string): string {
  return `${PHOTO_ID_PREFIXES.CHECKLIST}${itemId}_${uuid}`;
}
