import React from 'react';
import RichText from '@/components/RichText';
import Image from 'next/image';
import { ImagenConTextoBlock } from '@/payload-types';

interface ImagenConTextoComponentProps {
  texto: ImagenConTextoBlock['texto'];
  imagen: ImagenConTextoBlock['imagen'];
  posicion?: ImagenConTextoBlock['posicion'];
  anchoImagen?: ImagenConTextoBlock['anchoImagen'];
}

const ImagenConTextoComponent: React.FC<ImagenConTextoComponentProps> = ({
  texto,
  imagen,
  posicion = 'izquierda',
  anchoImagen = '33',
}) => {
  const flexDirection = posicion === 'derecha' ? 'row-reverse' : 'row';

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
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {typeof imagen === 'object' && imagen?.url && (
          <Image
            src={imagen.url}
            alt=""
            style={{
              width: `${anchoImagen}%`,
              maxWidth: '300px',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          />
        )}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            lineHeight: '1.6',
            fontSize: '1rem',
            wordBreak: 'break-word',
          }}
        >
          {/* Renderiza el richText con formato */}
          <RichText data={texto} />
        </div>
      </div>
    </div>
  );
};

export default ImagenConTextoComponent;
