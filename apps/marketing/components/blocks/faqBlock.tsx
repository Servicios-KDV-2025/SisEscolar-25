"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqBlockProps {
  title: string;
  items?: FaqItem[];
}

export const FaqBlock: React.FC<FaqBlockProps> = ({ title, items = [] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  // Si no hay items, no renderizamos nada (evita errores en SSR)
  if (!items.length) return null;

  return (
    <section className="bg-white py-12 px-4 rounded-xl shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">{title}</h2>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                className="w-full flex justify-between items-center text-left px-6 py-4 
                  font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>{item.question}</span>

                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-2 text-gray-500"
                >
                  ▶
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: { duration: 0.25 },
                        opacity: { duration: 0.2 }
                      }
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.2 },
                        opacity: { duration: 0.15 }
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
