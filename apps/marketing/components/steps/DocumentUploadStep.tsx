'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, X, Check } from 'lucide-react'

interface DocumentUploadProps {
  data?: {
    documents?: File[]
    uploadedFiles?: string[]
  }
  onDataChange?: (data: any) => void
}

const DocumentUploadStep: React.FC<DocumentUploadProps> = ({ data, onDataChange }) => {
  const [documents, setDocuments] = useState<File[]>(data?.documents || [])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const requiredDocuments = [
    { id: 'id', name: 'Documento de Identidad', required: true },
    { id: 'academic', name: 'Certificado Académico', required: true },
    { id: 'photo', name: 'Fotografía 3x4', required: true },
    { id: 'medical', name: 'Certificado Médico', required: false }
  ]

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const updatedDocuments = [...documents, ...newFiles]
    setDocuments(updatedDocuments)
    
    onDataChange?.({
      documents: updatedDocuments,
      uploadedFiles: updatedDocuments.map(f => f.name)
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index)
    setDocuments(updatedDocuments)
    onDataChange?.({
      documents: updatedDocuments,
      uploadedFiles: updatedDocuments.map(f => f.name)
    })
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return '🖼️'
    } else if (['pdf'].includes(extension || '')) {
      return '📄'
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝'
    }
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Lista de documentos requeridos */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Documentos Requeridos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg border">
              <div className="flex-shrink-0">
                {documents.some(file => file.name.toLowerCase().includes(doc.id)) ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {doc.required ? 'Obligatorio' : 'Opcional'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zona de subida */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-lg font-medium text-gray-900">
              Arrastra archivos aquí o{' '}
              <span className="text-blue-600 hover:text-blue-500">busca en tu computadora</span>
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          PDF, DOC, DOCX, JPG, PNG hasta 10MB cada uno
        </p>
      </div>

      {/* Lista de archivos subidos */}
      {documents.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Archivos Subidos ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getFileIcon(file.name)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Asegúrate de subir todos los documentos obligatorios antes de continuar. 
              Los archivos deben estar en formato PDF, DOC o imagen (JPG, PNG).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentUploadStep