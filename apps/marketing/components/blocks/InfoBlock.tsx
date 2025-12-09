import React from 'react';
import Image from 'next/image';
import { urlForImage } from '@/sanity/lib/utils';
import type { Image as SanityImage } from 'sanity';

interface InfoItem {
  icon?: SanityImage;
  title: string;
  description: string;
}

interface InfoBlockProps {
  title: string;
  subtitle?: string;
  items: InfoItem[]; // Aunque la interfaz espera un array, el runtime puede dar undefined/null
}

export default function InfoBlock({
  title,
  subtitle,
  items
}: InfoBlockProps) {
  return (
    <section className="bg-white py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid de items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 💡 CORRECCIÓN APLICADA: Se usa (items ?? []) para evitar el error .map() sobre undefined */}
          {(items ?? []).map((item, index) => { 
            const iconUrl = item.icon ? urlForImage(item.icon)?.url() : null;
            
            return (
              <div 
                key={index} 
                className="group flex flex-col items-start space-y-3 md:space-y-4 p-4 md:p-6 rounded-xl transition-all duration-300 hover:bg-gray-50 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                {/* Ícono */}
                <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-orange-100 group-hover:scale-110">
                  {iconUrl ? (
                    <div className="relative w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-110">
                      <Image
                        src={iconUrl}
                        alt={item.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-orange-200 rounded transition-all duration-300 group-hover:bg-orange-300" />
                  )}
                </div>

                {/* Contenido */}
                <div className="space-y-1.5 md:space-y-2">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-orange-600">
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}