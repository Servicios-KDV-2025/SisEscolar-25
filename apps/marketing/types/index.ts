import { LinkInternal, Price } from '@/sanity.types'
import type {PortableTextBlock} from 'next-sanity'
import type {Image} from 'sanity'

export interface MilestoneItem {
  _key: string
  description?: string
  duration?: {
    start?: string
    end?: string
  }
  image?: Image
  tags?: string[]
  title?: string
}

export interface StatsItems {
  number: string
  label: string
}

export interface BeneficioItem {
  _key: string
  beneficio: string
}

export interface AcordeonItem { 
  titulo?: string;
  contenido?: string;
}

export interface Empleados{
  imagen?: { asset?: any };
  puesto?: string;
  descripcion?: string;
}

export interface ImageItem {
  _type: "imageItem";
  _key: string;
  image?: { asset?: any };
}

export interface PriceItem {
  _type: "priceItem";
  _key: string;
  price?: Price;
}

export interface TextItem {
  _type: "textItem";
  _key: string;
  title?: string;
  description?: string;
}

export interface ShowcaseProject {
  _id: string
  _type: string
  coverImage?: Image
  overview?: PortableTextBlock[]
  slug?: string
  tags?: string[]
  title?: string
}


export interface SubMenuItem{
  _key: string;
  type_reference: "home" | "page" | null;
  title?: string | undefined;
  slug: string | null;
  link?: LinkInternal | undefined;
}