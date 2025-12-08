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
    <section className="bg-gray-50 py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Contenido izquierdo */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {title}
            </h2>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    • {feature.targetAudience}
                  </h3>
                  <p className="text-gray-600 pl-5">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {cta && (
              <div className="flex items-center gap-4 pt-4">
                {cta.label && (
                  <span className="text-gray-700 font-medium">
                    {cta.label}
                  </span>
                )}
                <a
                  href={cta.buttonUrl || '#'}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
                >
                  {cta.buttonText}
                </a>
              </div>
            )}
          </div>

          {/* Contenido derecho */}
          <div className="relative">
            {images?.length ? (
              <div className="grid grid-cols-2 gap-4">

                {images.map((image, index) => {
                  const url = urlForImage(image)?.url();
                  if (!url) return null; // Si la imagen no tiene _ref, se ignora

                  return (
                    <div
                      key={index}
                      className={`relative ${
                        index === 0 ? 'col-span-2 h-64' : 'h-48'
                      } rounded-lg overflow-hidden shadow-lg`}
                    >
                      <Image
                        src={url}
                        alt={`Feature image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  );
                })}

                {/* Elementos decorativos */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(16)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-900 rounded-full"
                      />
                    ))}
                  </div>
                </div>

              </div>
            ) : null}
          </div>

        </div>
      </div>
    </section>
  );
}
