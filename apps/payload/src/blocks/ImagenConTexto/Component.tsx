import React from 'react'
import RichText from '@/components/RichText'
import { ImagenConTextoBlock } from '@/payload-types'

export const ImagenConTextoComponent: React.FC<ImagenConTextoBlock> = ({
  texto,
  imagen,
  posicion = 'izquierda',
  anchoImagen = '33',
}) => {
  const flexDirection = posicion === 'derecha' ? 'row-reverse' : 'row'

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '1rem 2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection,
          alignItems: 'flex-start',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {imagen && typeof imagen !== 'number' && imagen?.url && (
          <img
            src={imagen.url}
            alt=""
            style={{
              width: `${anchoImagen}%`,
              maxWidth: '600px',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          />
        )}
        <div
          style={{
            flex: 1,
            minWidth: '300px',
            lineHeight: '1.6',
            fontSize: '1rem',
            wordBreak: 'break-word',
            textAlign: 'justify',  
          }}
        >
          {/* Renderiza el richText con formato */}
          <RichText data={texto} />
        </div>
      </div>
    </div>
  )
}
