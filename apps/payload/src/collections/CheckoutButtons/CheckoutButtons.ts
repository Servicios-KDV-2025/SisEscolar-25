// src/collections/CheckoutButtons.ts
import type { CollectionConfig } from 'payload'

const CheckoutButtons: CollectionConfig = {
  slug: 'checkoutButtons',
  access: {
    read: () => true,          
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'label', type: 'text', required: true, label: 'Etiqueta (admin)' },
    { name: 'priceId', type: 'text', required: true, label: 'Stripe Price ID' },
    { name: 'buttonText', type: 'text', required: false, label: 'Texto del botón' },
  ],
}

export default CheckoutButtons
