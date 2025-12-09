import React from 'react';
import Image from 'next/image';
import { urlForImage } from '@/sanity/lib/utils';
import type { Image as SanityImage } from 'sanity';

interface Feature {
  targetAudience: string;
  description: string;
}

interface CTA {
  label?: string;
  buttonText: string;
  buttonUrl?: string;
}

interface FeatureBlockProps {
  title: string;
  features: Feature[];
  images?: SanityImage[];
  cta?: CTA;
}

export default function FeatureBlock({
  title,
  features,
  images,
  cta
}: FeatureBlockProps) {
  return (
    <section className="bg-gray-50 py-12 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start md:items-center">
          
          {/* Contenido izquierdo */}
          <div className="space-y-6 md:space-y-8 max-w-md mx-auto text-center md:text-left">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {title}
            </h2>

            <div className="space-y-5 md:space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="space-y-1.5">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    • {feature.targetAudience}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 pl-5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contenido derecho */}
          <div className="relative min-h-[450px]">
            {images?.length ? (
              <div className="relative flex flex-col gap-4">

                {/* Primera imagen */}
                {images[0] && (() => {
                  const url = urlForImage(images[0])?.url();
                  return url ? (
                    <div className="relative w-[280px] h-[200px] rounded-lg overflow-hidden shadow-xl z-10">
                      <Image
                        src={url}
                        alt="Feature image 1"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null;
                })()}

                {/* Líneas decorativas */}
                <div className="absolute top-0 right-0 w-40 h-32 z-20">
                  <svg viewBox="0 0 160 128" className="w-full h-full">
                    {[...Array(8)].map((_, i) => (
                      <path
                        key={i}
                        d={`M 0 ${i * 16 + 8} Q 40 ${i * 16}, 80 ${i * 16 + 8} T 160 ${i * 16 + 8}`}
                        stroke="#F97316"
                        strokeWidth="3"
                        fill="none"
                        opacity={0.8}
                      />
                    ))}
                  </svg>
                </div>

                {/* Segunda imagen */}
                {images[1] && (() => {
                  const url = urlForImage(images[1])?.url();
                  return url ? (
                    <div className="relative w-[320px] h-[220px] rounded-lg overflow-hidden shadow-xl ml-auto z-10">
                      <Image
                        src={url}
                        alt="Feature image 2"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null;
                })()}

                {/* Puntos decorativos */}
                <div className="absolute bottom-8 right-0 grid grid-cols-4 gap-2 z-0">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-blue-900 rounded-full"
                    />
                  ))}
                </div>

              </div>
            ) : null}
          </div>
        </div>

        {/* CTA centrado debajo */}
        {cta && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-10 text-center">
            {cta.label && (
              <span className="text-gray-600 text-sm sm:text-base">
                {cta.label}
              </span>
            )}
            <a
              href={cta.buttonUrl || '#'}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded font-medium transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg text-sm whitespace-nowrap"
            >
              {cta.buttonText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}