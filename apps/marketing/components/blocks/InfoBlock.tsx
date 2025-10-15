import React from 'react'
import NextImage from "next/image"; //alias para evitar colisiones
import { urlForImage } from '@/sanity/lib/utils';


interface InfoBlockProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: { asset?: any };
  accentColor?: string;
}

export const InfoBlock: React.FC<InfoBlockProps> = ({ 
  title, 
  subtitle, 
  description, 
  icon, 
  accentColor, 
}) => {
  const imageUrl = icon && urlForImage(icon.asset)?.fit('crop').url();
  return (
    <div className="flex gap-4 items-start p-4 bg-white rounded-xl shadow-sm">
  {iconUrl ? (
  <NextImage
    src={iconUrl}
    alt={title || 'icon'}
    width={50}
    height={50}
    style={{ objectFit: 'contain' }}
  />
) : (
  <div
    style={{
      width: 28,
      height: 28,
      background: accentColor,
      borderRadius: 4,
    }}
  />
)}
      <div className="flex-1">
        <h3 className="text-lg font-semibold" style={{ color: accentColor }}>{title}</h3>
        {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
        {description && <p className="text-gray-700 mt-2">{description}</p>}
      </div>
    </div>
  )
}