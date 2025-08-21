// src/blocks/CheckoutButton/config.ts
import type { Block } from 'payload';

export const CheckoutButton: Block = {
  slug: 'checkoutButton',
  labels: { singular: 'Botón de Checkout', plural: 'Botones de Checkout' },
  fields: [
    {
      name: 'priceId',
      type: 'text',
      label: 'Stripe Price ID',
      required: true,
      admin: {
        description: 'ID de precio Stripe (empieza con "price_")',
        placeholder: 'price_123...',
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      label: 'Texto del botón (opcional)',
      required: false,
      defaultValue: 'Pagar ahora',
    },
  ],
};

export default CheckoutButton;
