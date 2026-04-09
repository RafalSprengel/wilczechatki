export interface Property {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  baseCapacity: number;
  maxExtraBeds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}