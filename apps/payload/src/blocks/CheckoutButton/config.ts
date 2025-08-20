import { Block } from 'payload'

export const CheckoutButton: Block = {
  slug: 'checkoutButton',
  labels: { singular: 'Botón de Checkout', plural: 'Botones de Checkout' },
  fields: [
    {
      name: 'buttonText',
      type: 'text',
      label: 'Texto del botón',
      required: true,
      defaultValue: 'Pagar ahora',
    },
    {
      name: 'priceId',
      type: 'text',
      label: 'Stripe Price ID (price_...)',
      required: true,
      admin: { description: 'ID de precio de Stripe (modo test: price_*)' },
    },
    {
      name: 'schoolName',
      type: 'text',
      label: 'Nombre de la escuela (opcional)',
    },
    {
      name: 'userName',
      type: 'text',
      label: 'Nombre de usuario (opcional)',
    },
  ],
}

export default CheckoutButton
