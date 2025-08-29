// definición de la colección "payments"
import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { anyone } from '@/access/anyone'

export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    useAsTitle: 'eventId',
    defaultColumns: ['eventId', 'type', 'status', 'amount_total', 'updatedAt'],
  },
  access: {
    create: anyone,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    { name: 'eventId', type: 'text', required: true, unique: true },
    { name: 'type', type: 'text', required: true },

    { name: 'sessionId', type: 'text' },
    { name: 'paymentIntentId', type: 'text' },
    { name: 'customerId', type: 'text' },

    { name: 'amount_total', type: 'number' },
    { name: 'currency', type: 'text' },
    { name: 'status', type: 'text' },

    { name: 'metadata', type: 'json' },
    { name: 'raw', type: 'json' }, // evento completo para auditoría
  ],
  // (opcional) acceso básico: sólo admin o usuario autenticado
  // access: {
  //   read: ({ req }) => !!req.user,
  //   create: ({ req }) => !!req.user,
  //   update: ({ req }) => !!req.user,
  //   delete: ({ req }) => !!req.user,
  // },
}

export default Payments
