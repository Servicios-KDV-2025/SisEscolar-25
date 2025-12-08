'use client'

/**
 * This config is used to set up Sanity Studio that's mounted on the `app/studio/[[...index]]/page.tsx` route
 */
import {apiVersion, dataset, projectId, studioUrl} from '@/sanity/lib/api'
import * as resolve from '@/sanity/plugins/resolve'
import {pageStructure, singletonPlugin} from '@/sanity/plugins/settings'
import page from '@/sanity/schemas/documents/page'
import project from '@/sanity/schemas/documents/project'
import duration from '@/sanity/schemas/objects/duration'
import home from '@/sanity/schemas/singletons/home'
import settings from '@/sanity/schemas/singletons/settings'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import nav from './sanity/schemas/objects/global/nav'
import linkExternal from './sanity/schemas/objects/link/linkExternal'
import linkInternal from '@/sanity/schemas/objects/link/linkInternal'
import footer from '@/sanity/schemas/objects/global/footer'
import herosection from '@/sanity/schemas/objects/modules/herosection'
import featureItem from '@/sanity/schemas/objects/modules/featureItem'
import featuresection from '@/sanity/schemas/objects/modules/featuresection'
import statsection from '@/sanity/schemas/objects/modules/statsection'
import ctaSection from '@/sanity/schemas/objects/modules/ctaSection'
import infoBlock from '@/sanity/schemas/objects/modules/infoBlock'
import ImagewithText from '@/sanity/schemas/objects/modules/ImagewithText'
import carousel from '@/sanity/schemas/objects/modules/carousel'
import acordeon from './sanity/schemas/objects/modules/acordeon'
import carouselavatar from './sanity/schemas/objects/modules/carouselavatar'
import contentwithmedia from './sanity/schemas/objects/modules/contentwithmedia'
import price from './sanity/schemas/documents/price'
import priceblock from './sanity/schemas/objects/modules/priceblock'
import { gridType } from './sanity/schemas/objects/modules/gridType'
import paymentStatus from '@/sanity/schemas/objects/modules/Payment'
import { featureBlock } from './sanity/schemas/objects/modules/featureBlock'
const title =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_TITLE || 'Next.js Personal Website with Sanity.io'

export default defineConfig({
  basePath: studioUrl,
  projectId: projectId || '',
  dataset: dataset || '',
  title,
  schema: {
    // If you want more content types, you can add them to this array
    types: [
      // Singletons
      home,
      settings,
      // Documents
      duration,
      page,
      project,
      price,
      //Global
      nav,
      footer,
      //Link
      linkExternal,
      linkInternal,
      // Objects
      herosection,
      featureItem,
      featuresection,
      statsection,
      ctaSection, 
      paymentStatus,
      infoBlock,
      ImagewithText,
      carousel,
      acordeon,
      carouselavatar,
      contentwithmedia,
      priceblock,
      gridType,
      featureBlock,
    ],
  },
  plugins: [
    structureTool({
      structure: pageStructure([home, settings]),
    }),
    presentationTool({
      resolve,
      previewUrl: {previewMode: {enable: '/api/draft-mode/enable'}},
    }),
    // Configures the global "new document" button, and document actions, to suit the Settings document singleton
    singletonPlugin([home.name, settings.name]),
    // Add an image asset source for Unsplash
    unsplashImageAsset(),
    // Vision lets you query your content with GROQ in the studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
