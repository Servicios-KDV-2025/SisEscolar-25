'use client'

import React from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { AcordeonBlock } from '@/payload-types'

export const Acordeon: React.FC<AcordeonBlock> = ({ titulo, items }) => {
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">{titulo}</h2>
      <Accordion type="single" collapsible className="max-w-2xl mx-auto rounded-lg">
        {items &&
          items.map((item, index) => (
            <AccordionItem value={String(index)} key={index}>
              <AccordionTrigger>{item.titulo}</AccordionTrigger>
              <AccordionContent>{item.contenido}</AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </section>
  )
}
