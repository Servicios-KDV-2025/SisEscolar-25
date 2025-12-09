"use client";
import { useState } from "react";
import Image from "next/image";
import { urlForImage } from "@/sanity/lib/utils";
import type { Image as SanityImage } from "sanity";

interface CarouselBlockProps {
  title?: string;
  images?: SanityImage[];
}

export default function CarouselBlock({ title, images }: CarouselBlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getVisibleImages = () => {
    const visible = [];
    const totalImages = images.length;

    const prevIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1;
    visible.push({ index: prevIndex, position: "left" });

    visible.push({ index: currentIndex, position: "center" });

    const nextIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1;
    visible.push({ index: nextIndex, position: "right" });

    return visible;
  };

  const visibleImages = getVisibleImages();

  const positionClasses = {
    left:
      "left-0 -translate-x-1/3 scale-[0.7] opacity-40 -rotate-y-[25deg] z-0",
    center:
      "left-1/2 -translate-x-1/2 scale-100 opacity-100 rotate-y-0 z-20",
    right:
      "right-0 translate-x-1/3 scale-[0.7] opacity-40 rotate-y-[25deg] z-0",
  };

  return (
    <section className="bg-white py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">

        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-12">
            {title}
          </h2>
        )}

        <div className="relative">

          <div className="relative h-64 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden perspective-[2000px]">

            {visibleImages.map(({ index, position }) => {
              const image = images[index];
              const imageUrl = image ? urlForImage(image)?.url() : null;

              if (!imageUrl) return null;

              return (
               <div
               key={`${index}-${position}`}
               className={`
               absolute top-1/2 -translate-y-1/2
               w-72 md:w-96 lg:w-[480px]
                h-48 md:h-60 lg:h-72
                transition-all duration-\[600ms\] ease-out
              ${positionClasses[position as keyof typeof positionClasses]}
            `}
            >

                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src={imageUrl}
                      alt={`Imagen ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={position === "center"}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Anterior"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Siguiente"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-2 mt-8">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-2 bg-gray-800"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
