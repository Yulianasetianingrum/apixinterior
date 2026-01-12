export type CategoryGridItem = {
  categoryId: string | number;
  title: string;
  href: string;
  imageUrl?: string | null;
  subtitle?: string | null;
};

export type CategoryGridData = {
  title?: string | null;
  columns?: number; // dari config
  items: CategoryGridItem[];
};
