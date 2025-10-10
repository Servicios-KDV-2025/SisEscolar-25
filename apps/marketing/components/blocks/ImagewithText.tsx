// ImagewithText.jsx
import React from "react";
import { urlForImage } from "@/sanity/lib/utils";

// interface ImagenSanity {
//   _type: 'image',
//   asset: {
//     _ref: string
//   },
//   alt?: string;
// }

interface ImagewithTextProps {
  Titulo?: string;
  Descripcion?: string;
  'Imagen'?: { asset?: any };
  Alineacion?: "izquierda" | "derecha";
}

export const ImagewithText = ({
  Titulo,
  Descripcion,
  Imagen,
  Alineacion = "izquierda",
}: ImagewithTextProps) => {

  // Genera la URL de la imagen usando la función urlFor
  const resolvedUrl = Imagen ? urlForImage(Imagen)?.url() : null;
  const altText =  Titulo || "Imagen";

  return (
    <div
      className={`flex flex-col md:flex-row ${
        Alineacion === "derecha" ? "md:flex-row-reverse" : ""
      } items-center my-8`}
    >
      <div className="md:w-1/2 p-4">
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={altText}
            className="w-full h-auto rounded-lg shadow-lg"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="md:w-1/2 p-4">
        {Titulo && <h2 className="text-2xl font-bold mb-4">{Titulo}</h2>}
        {Descripcion && <p className="text-gray-700">{Descripcion}</p>}
      </div>
    </div>
  );
};

export default ImagewithText;