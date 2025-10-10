import { defineField, defineType } from "sanity";

export default defineType({
  name: "nav",
  title: "Navigation",
  type: "object",
  description: "Navigation settings for the website",
  fields: [
    defineField({
      name: "menus",
      title: "Menus",
      type: "array",
      of: [
        {
          type: "object",
          name: "simpleMenu",
          title: "Menu Simple",
          fields: [
            defineField({
              name: "link",
              title: "Link",
              type: "linkInternal",
            }),
          ],
          preview: {
            select: {
              title: "link.title",
            },
            prepare({ title }) {
              return {
                title: title || "Menu",
                subtitle: "Menu simple",
              };
            },
          },
        },
        {
          type: "object",
          name: "menuWithSubmenu",
          title: "Menu con Submenús",
          fields: [
            defineField({
              name: "title",
              title: "Título del menú",
              type: "string",
            }),
            defineField({
              name: "submenus",
              title: "Submenús",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "submenuItem",
                  fields: [
                    defineField({
                      name: "title",
                      title: "Título",
                      type: "string",
                    }),
                    defineField({
                      name: "link",
                      title: "Link",
                      type: "linkInternal",
                    }),
                  ],
                },
              ],
            }),
          ],
          preview: {
            select: {
              title: "title",
              submenuCount: "submenus",
            },
            prepare({ title, submenuCount }) {
              return {
                title: title || "Menu",
                subtitle: `Con ${submenuCount?.length || 0} submenús`,
              };
            },
          },
        },
      ],
    }),
  ],
});