export interface Property {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  baseCapacity: number;
  maxExtraBeds: number;
  isActive: boolean;
  type: 'single' | 'whole';
  createdAt: string;
  updatedAt: string;
}