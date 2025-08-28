import type { BloqueInformativo } from '@/payload-types'
import React from 'react'
import Image from 'next/Image'
// Definición de los props que se recibirán en el componente
type Props = BloqueInformativo & {
  titulo: string
  descripcionCorta: string
  descripcionLarga: string
  icono: {
    url?: string
    alt?: string
  }
}

// Componente funcional que representa un bloque informativo
export const BloqueInformativoComponet: React.FC<Props> = ({
  titulo,
  descripcionCorta,
  descripcionLarga,
  icono,
}) => {
  return (
    <div
      // Contenedor principal del bloque
      // bg-transparent: fondo transparente (se adapta al fondo de la página)
      // dark:bg-transparent: asegura que también en modo oscuro siga siendo transparente
      // shadow: sombra suave para separar visualmente el bloque del fondo
      // rounded-lg: esquinas redondeadas
      // p-6: padding interno
      // max-w-4xl mx-auto: limita el ancho y centra horizontalmente
      className="bg-transparent dark:bg-transparent shadow rounded-lg p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-start space-x-4">
        {icono?.url && (
          <Image
          src={icono.url}
          alt={icono.alt ?? "Ícono"}
          width={32}
          height={32}
          className="mt-1"
          />
        )}
        <div>
          {/* Título con color adaptado al modo oscuro */}
          <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{titulo}</h3>

          {/* Descripción corta con texto gris adaptable al modo oscuro */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{descripcionCorta}</p>

          {/* Descripción larga con espacio para saltos de línea y colores para ambos modos */}
          <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line">
            {descripcionLarga}
          </p>
        </div>
      </div>
    </div>
  )
}
