'use client'

import React from 'react'
import { CheckCircle, FileText, User, Calendar } from 'lucide-react'

interface ReviewConfirmProps {
  data?: {
    personalInfo?: any
    documents?: any
    [key: string]: any
  }
  onDataChange?: (data: any) => void
}

const ReviewConfirmStep: React.FC<ReviewConfirmProps> = ({ data, onDataChange }) => {
  const personalInfo = data?.personalInfo || {}
  const documents = data?.documents || {}

  const handleConfirmation = (confirmed: boolean) => {
    onDataChange?.({ ...data, confirmed })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Revisa tu Información
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Verifica que todos los datos sean correctos antes de enviar tu solicitud
        </p>
      </div>

      {/* Resumen de Información Personal */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Información Personal</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Nombres:</span>
            <span className="ml-2 text-gray-900">{personalInfo.firstName || 'No especificado'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Apellidos:</span>
            <span className="ml-2 text-gray-900">{personalInfo.lastName || 'No especificado'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-900">{personalInfo.email || 'No especificado'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Teléfono:</span>
            <span className="ml-2 text-gray-900">{personalInfo.phone || 'No especificado'}</span>
          </div>
        </div>
      </div>

      {/* Resumen de Documentos */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Documentos Subidos</h4>
        </div>
        {documents.uploadedFiles && documents.uploadedFiles.length > 0 ? (
          <div className="space-y-2">
            {documents.uploadedFiles.map((fileName: string, index: number) => (
              <div key={index} className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-gray-900">{fileName}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No se han subido documentos</p>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Información del Proceso</h4>
        </div>
        <div className="text-sm space-y-2">
          <p><span className="font-medium">Fecha de solicitud:</span> {new Date().toLocaleDateString('es-ES')}</p>
          <p><span className="font-medium">Estado:</span> Pendiente de revisión</p>
          <p><span className="font-medium">Tiempo estimado:</span> 3-5 días hábiles</p>
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            onChange={(e) => handleConfirmation(e.target.checked)}
          />
          <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
            <span className="font-medium">Acepto los términos y condiciones</span>
            <p className="mt-1 text-gray-600">
              He revisado toda la información proporcionada y confirmo que es correcta. 
              Entiendo que cualquier información falsa puede resultar en el rechazo de mi solicitud.
            </p>
          </label>
        </div>
      </div>

      {/* Acciones adicionales */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              ¿Todo listo?
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Una vez que envíes tu solicitud, recibirás un correo de confirmación. 
                Te notificaremos sobre el estado de tu solicitud en los próximos días.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewConfirmStep