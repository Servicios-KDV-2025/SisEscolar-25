import { defineType, defineField } from "sanity";

export const CarBlock = defineType({
  name: "CarBlock",
  title: "Características",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Imagen",
      type: "image",
      options: { hotspot: true },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "subtitle",
      title: "Subtítulo",
      type: "string"
    }),
    defineField({
      name: "body",
      title: "Descripción",
      type: "text",
      rows: 5,
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      media: "image"
    }
  }
});
