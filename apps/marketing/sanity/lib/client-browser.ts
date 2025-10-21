import { apiVersion, dataset, projectId, studioUrl } from '@/sanity/lib/api'
import { createClient } from 'next-sanity'

// Cliente seguro para el navegador (sin tokens)
export const clientBrowser = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega: {
    studioUrl,
    logger: console,
  },
})
