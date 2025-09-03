import { Block } from 'payload';

export const PaymentStatus: Block = {
  slug: "paymentStatus",
  labels: {
    singular: "Estado de Pago",
    plural: "Estados de Pago",
  },
  fields: [
    {
      name: "status",
      type: "select",
      label: "Estado del pago",
      required: true,
      defaultValue: "success",
      options: [
        { label: "Éxito (Verde)", value: "success" },
        { label: "Cancelado (Rojo)", value: "cancelled" },
      ],
    },
    {
      name: "title",
      type: "text",
      label: "Título",
      required: true,
      defaultValue: "¡Pago exitoso!",
    },
    {
      name: "message",
      type: "textarea",
      label: "Mensaje",
      defaultValue:
        "Gracias por tu compra. Hemos recibido tu pago y tu pedido está en proceso.",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Imagen",
    },
    {
      name: "button",
      type: "group",
      label: "Botón",
      fields: [
        {
          name: "label",
          type: "text",
          label: "Texto del botón",
          defaultValue: "Volver al inicio",
        },
        {
          name: "url",
          type: "text",
          label: "URL de destino",
          defaultValue: "/",
        },
      ],
    },
  ],
};
