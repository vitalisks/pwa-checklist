export interface EditItemData {
  id: string;
  text: string;
  description?: string;
  photoIds?: string[];
  guidePhotoIds?: string[];
  imageLinks?: string[];
}

export interface EditCategoryData {
  id: string;
  name: string;
  items: EditItemData[];
  unwrapped?: boolean;
}

export interface EditorHandlers {
  commit: (categories: EditCategoryData[]) => void;
  addCategory: () => void;
  removeCategory: (categoryId: string) => void;
  addItem: (categoryId: string) => void;
  updateCategoryName: (categoryId: string, name: string) => void;
  updateItemText: (itemId: string, text: string) => void;
  updateItemDesc: (itemId: string, desc: string) => void;
  removeItem: (categoryId: string, itemId: string) => void;
  addPhoto: (categoryId: string, itemId: string, file: File) => void;
  deletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
  viewPhotos: (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => void;
  toggleCategoryUnwrap: (categoryId: string) => void;
}
