import React from "react";
import NextImage from "next/image"; // alias para evitar colisiones
import { urlForImage } from "@/sanity/lib/utils";

interface ImagenSanity {
  _type?: string;
  asset?: { _ref?: string };
  alt?: string;
}

interface ImagewithTextProps {
  Titulo?: string;
  Descripcion?: string;
  Imagen?: ImagenSanity | null;
  Alineacion?: "izquierda" | "derecha";
}

export const ImagewithText: React.FC<ImagewithTextProps> = ({
  Titulo,
  Descripcion,
  Imagen,
  Alineacion = "izquierda",
}) => {
  // Resuelve la url (puede ser null)
  const resolvedUrl = Imagen ? (urlForImage(Imagen as any)?.url() ?? null) : null;
  const altText = Titulo ?? "Imagen";

  const isRight = Alineacion === "derecha";

  return (
    <div
      className={`w-full max-w-[1200px] mx-auto flex flex-col md:flex-row ${
        isRight ? "md:flex-row-reverse" : ""
      } items-center gap-6 md:gap-12`}
    >
      <div className="w-full md:w-1/2 flex justify-center">
        {resolvedUrl ? (
          // Usamos NextImage con width/height (más simple y evita problemas con SVGs)
          <div className="relative w-full max-w-[600px] h-[360px]">
            <NextImage
              src={resolvedUrl}
              alt={altText}
          
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-xl object-cover"
              priority={false}
            />
          </div>
        ) : (
          <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 px-2">
        {Titulo && <h2 className="text-2xl font-semibold mb-3">{Titulo}</h2>}
        {Descripcion && <p className="text-gray-700 leading-relaxed">{Descripcion}</p>}
      </div>
    </div>
  );
};

export default ImagewithText;
