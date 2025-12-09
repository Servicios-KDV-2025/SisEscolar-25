"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { urlForImage } from "@/sanity/lib/utils";

interface CarBlockProps {
  image: any; // recibe la imagen de Sanity
  title: string;
  subtitle?: string;
  body: string;
}

export default function CarBlock({ image, title, subtitle, body }: CarBlockProps) {
  // Genera la URL solo si existe un asset
  const imageUrl = image?.asset ? urlForImage(image)?.url() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center p-4 md:p-10 rounded-2xl hover:shadow-lg transition-shadow duration-300"
    >
      {/* Imagen con microinteracción */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-xl shadow-sm"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={900}
            height={700}
            className="w-full h-[260px] object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-[260px] bg-gray-200 rounded-xl" />
        )}
      </motion.div>

      {/* Texto */}
      <div className="space-y-3">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold"
        >
          {title}
        </motion.h3>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="text-gray-500"
          >
            {subtitle}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45 }}
          className="text-gray-600 leading-relaxed"
        >
          {body}
        </motion.p>
      </div>
    </motion.div>
  );
}
