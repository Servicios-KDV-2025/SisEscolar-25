import type { CollectionConfig } from 'payload';

const CheckoutButtons: CollectionConfig = {
  slug: 'checkoutButtons',
  admin: { useAsTitle: 'label' },
  access: { read: () => true },
  fields: [
    { name: 'label', type: 'text', label: 'Etiqueta (admin)', required: true },
    {
      name: 'priceId',
      type: 'text',
      label: 'Stripe Price ID',
      required: true,
      admin: { placeholder: 'price_123...', description: 'Pega el ID de precio (price_*)' },
    },
    { name: 'buttonText', type: 'text', label: 'Texto del botón (opcional)', defaultValue: 'Pagar ahora' },
  ],
};

export default CheckoutButtons;
