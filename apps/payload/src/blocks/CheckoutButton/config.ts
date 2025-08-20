// src/blocks/CheckoutButton/config.ts
import { Block } from 'payload';

export const CheckoutButton: Block = {
  slug: 'checkoutButton',
  interfaceName: 'checkoutButton',
  labels: { singular: 'Botón de Checkout', plural: 'Botones de Checkout' },
  fields: [
    {
      name: 'buttonText',
      type: 'text',
      label: 'Texto del botón',
      required: false,
      defaultValue: 'Finalizar y pagar',
    },
    {
      name: 'priceId',
      type: 'text',
      label: 'Stripe Price ID (price_...)',
      required: true,
      admin: { description: 'ID de precio de Stripe (modo test: price_*)' },
    },
  ],
};

export default CheckoutButton;