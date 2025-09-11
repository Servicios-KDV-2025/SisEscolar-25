// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { Archive } from './blocks/ArchiveBlock/config'
import { Content } from './blocks/Content/config'
import { CallToAction } from './blocks/CallToAction/config'
import { MediaBlock } from './blocks/MediaBlock/config'
import { FormBlock } from './blocks/Form/config'
import { Acordeon } from './blocks/Acordeon/config'
import { ImagenConTextoBlock } from './blocks/ImagenConTexto/config'
import { BloqueInformativo } from './blocks/BloqueInformativo/config'
import { ContentWithMedia } from './blocks/ContentWithMedia/config'
import { PriceBlock } from './blocks/PriceBlock/config'
import { TextBlock } from './blocks/Text/config'
import { Column } from './blocks/Column/config'
import { Row } from './blocks/Row/config'
import { Section } from './blocks/Section/config'
import { Carousel } from './blocks/Carousel/config'
import { CarouselAvatar } from './blocks/CarouselAvatar/config'
import { PaymentStatus } from './blocks/PaymentStatus/config'
import { Prices } from './collections/Prices'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  collections: [Pages, Posts, Media, Categories, Users, Prices],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  blocks: [
    Archive,
    Content,
    CallToAction,
    MediaBlock,
    FormBlock,
    Acordeon,
    ImagenConTextoBlock,
    BloqueInformativo,
    ContentWithMedia,
    PriceBlock,
    TextBlock,
    Column,
    Row,
    Section,
    Carousel,
    CarouselAvatar,
    PaymentStatus,
  ],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
