import { LinkInternal } from '@/sanity.types'
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

export interface SingleMenuItem {
  link?: LinkInternal | null;
  slug?: string | null;
  type_reference?: 'home' | 'page' | null;
}

export interface MultiMenuItem {
  title?: string;
  submenu?: SubmenuItem[] | null;
}

export interface SubmenuItem{
  title?: string;
  link?: LinkInternal | null;
  slug?: string | null;
  type_reference?: 'home' | 'page' | null;
  _key?: string;
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
