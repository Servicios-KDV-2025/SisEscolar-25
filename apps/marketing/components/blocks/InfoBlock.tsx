import { urlForImage } from '@/sanity/lib/utils'
import Image from 'next/image'

interface InfoBlockProps {
  title: string
  subtitle?: string
  description?: string
  icon?: { asset?: any }
}
 
export const InfoBlock: React.FC<InfoBlockProps> = ({
  title,
  subtitle,
  description,
  icon,
}) => {
  const imageUrl = icon && urlForImage(icon)?.fit('crop').url()
  
  return (
    // Contenedor principal 
      //hover efecto sombra 
    <div className="flex gap-4 items-start p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Ícono */}
      <div className="flex-shrink-0">
        {imageUrl ? (
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
            <Image 
              src={imageUrl} 
              alt={title || 'icon'} 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100" />
        )}
      </div>
     
      {/* Contenido */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
        )}
        {description && (
          <p className="text-gray-600 mt-2 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
