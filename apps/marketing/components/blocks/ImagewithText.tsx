import React from "react";
import { urlForImage } from "@/sanity/lib/utils";
import NextImage from "next/image"; //alias para evitar colisiones
type ImgAsset = {
  _ref?: string;
  _type?: string;
};

type ImagenSanity = {
  _type?: "image" | string;
  asset?: ImgAsset;
  alt?: string;
};

type Alignment = "izquierda" | "derecha" | "left" | "right";

interface ImagewithTextProps {
  Titulo?: string;
  Descripcion?: string;
  Imagen?: ImagenSanity | null;
  title?: string;
  description?: string;
  image?: ImagenSanity | null;
  Alineacion?: Alignment;
  alignment?: Alignment;
}

export const ImagewithText: React.FC<ImagewithTextProps> = (props) => {
  const title = props.title ?? props.Titulo;
  const description = props.description ?? props.Descripcion;
  const image = props.image ?? props.Imagen;
  const alignment = props.alignment ?? props.Alineacion ?? "izquierda";

  const normalizedAlignment: "left" | "right" =
    alignment === "derecha" || alignment === "right" ? "right" : "left";

  let resolvedUrl: string | null = null;
  try {
    const builder = image ? urlForImage(image as any) : null;
    if (builder && typeof builder.url === "function") {
      resolvedUrl = builder.url();
    } else if (typeof builder === "string") {
      resolvedUrl = builder;
    }
  } catch {
    resolvedUrl = null;
  }

  const altText = image?.alt ?? title ?? "Imagen";

  return (
    <div
      className={`w-full max-w-[1200px] mx-auto flex flex-col md:flex-row ${
        normalizedAlignment === "right" ? "md:flex-row-reverse" : ""
      } items-center gap-6 md:gap-12`}
    >
      {/* Imagen */}
      <div className="w-full md:w-1/2 flex justify-center">
        {resolvedUrl ? (
          <NextImage
            src={resolvedUrl}
            alt={altText}
            width={200}
            height={200}
            className="w-full h-auto max-h-[450px] object-cover rounded-xl shadow-md"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
            Sin imagen
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="w-full md:w-1/2 text-center md:text-left px-2">
        {title && <h2 className="text-2xl font-semibold mb-3">{title}</h2>}
        {description && <p className="text-gray-700 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
};

export default ImagewithText;
