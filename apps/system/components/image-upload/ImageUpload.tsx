"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ClipboardEvent } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Upload, X, Link as LinkIcon, Loader2 } from "@repo/ui/icons";
import { Image as ImageIcon } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@repo/convex/convex/_generated/api";
import { Id } from "@repo/convex/convex/_generated/dataModel";
import { toast } from "@repo/ui/sonner";
import Image from "next/image";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg", ".webp"];

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ currentImageUrl, onImageUploaded, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useAction(api.functions.fileStorage.generateUploadUrl);
  const getFileUrl = useAction(api.functions.fileStorage.getFileUrl);

  // Actualizar preview cuando cambie currentImageUrl
  useEffect(() => {
    if (currentImageUrl && currentImageUrl !== " " && currentImageUrl !== "") {
      setPreviewUrl(currentImageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [currentImageUrl]);

  const validateFile = (file: File): string | null => {
    // Validar tipo MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo de archivo no permitido. Solo se aceptan: JPEG, PNG, SVG y WEBP`;
    }

    // Validar extensión
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return `Extensión de archivo no permitida. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      return `El archivo es demasiado grande (${sizeInMB}MB). El tamaño máximo es 20MB`;
    }

    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(
        <span style={{ color: "#dc2626" }}>Error de validación</span>,
        {
          className: "bg-white border border-red-200",
          unstyled: false,
          description: validationError,
        }
      );
      return;
    }

    setIsUploading(true);
    try {
      // Generar URL de subida
      const uploadUrl = await generateUploadUrl();
      
      // Subir el archivo
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Error al subir el archivo");
      }

      // Obtener el storageId del resultado
      // Convex devuelve el storageId como JSON: {"storageId": "..."}
      const responseText = await result.text();
      let storageId: string;
      
      try {
        // Parsear el JSON para extraer el storageId
        const jsonResponse = JSON.parse(responseText);
        storageId = jsonResponse.storageId;
        
        // Si no está en storageId, intentar usar el valor directamente
        if (!storageId && typeof jsonResponse === 'string') {
          storageId = jsonResponse;
        }
      } catch {
        // Si no es JSON válido, usar el texto directamente (por si acaso)
        storageId = responseText.trim();
      }
      
      if (!storageId || storageId.length === 0) {
        throw new Error("No se recibió el ID del archivo");
      }
      
      // Limpiar el storageId en caso de que tenga comillas o espacios
      storageId = storageId.replace(/^["']|["']$/g, '').trim();
      
      // Obtener la URL permanente
      const permanentUrl = await getFileUrl({ storageId: storageId as Id<"_storage"> });
      
      if (!permanentUrl) {
        throw new Error("No se pudo obtener la URL del archivo");
      }

      // Actualizar preview y notificar al componente padre
      setPreviewUrl(permanentUrl);
      onImageUploaded(permanentUrl);

      toast.success(
        <span style={{ color: "#16a34a", fontWeight: 600 }}>Imagen subida exitosamente</span>,
        {
          className: "bg-white border border-green-200",
          unstyled: false,
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error); 
      toast.error(
        <span style={{ color: "#dc2626" }}>Error al subir la imagen</span>,
        {
          className: "bg-white border border-red-200",
          unstyled: false,
          description: error instanceof Error ? error.message : "Intenta nuevamente",
        }
      );
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, getFileUrl, onImageUploaded]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0);
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [disabled, handleFileSelect]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const items = e.clipboardData.items;
    // Convertir DataTransferItemList a array para iterar de forma segura
    const itemsArray = Array.from(items);
    for (const item of itemsArray) {
      if (item && item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
      }
    }
  }, [disabled, uploadFile]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {
      toast.error(
        <span style={{ color: "#dc2626" }}>URL inválida</span>,
        {
          className: "bg-white border border-red-200",
          unstyled: false,
          description: "Por favor ingresa una URL válida",
        }
      );
      return;
    }

    // Validar que sea una URL válida
    try {
      const url = new URL(urlInput.trim());
      // Validar que sea una imagen
      const imageExtensions = ["jpg", "jpeg", "png", "svg", "webp"];
      const pathname = url.pathname.toLowerCase();
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(`.${ext}`));
      
      if (!hasImageExtension && !url.pathname.match(/\.(jpg|jpeg|png|svg|webp)/i)) {
        // Si no tiene extensión, intentar cargar la imagen para validar
        setPreviewUrl(urlInput.trim());
        onImageUploaded(urlInput.trim());
        setShowUrlInput(false);
        setUrlInput("");
        
        toast.success(
          <span style={{ color: "#16a34a", fontWeight: 600 }}>URL de imagen guardada</span>,
          {
            className: "bg-white border border-green-200",
            unstyled: false,
          }
        );
        return;
      }

      setPreviewUrl(urlInput.trim());
      onImageUploaded(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput("");
      
      toast.success(
        <span style={{ color: "#16a34a", fontWeight: 600 }}>URL de imagen guardada</span>,
        {
          className: "bg-white border border-green-200",
          unstyled: false,
        }
      );
    } catch {
      toast.error(
        <span style={{ color: "#dc2626" }}>URL inválida</span>,
        {
          className: "bg-white border border-red-200",
          unstyled: false,
          description: "Por favor ingresa una URL válida",
        }
      );
    }
  }, [urlInput, onImageUploaded]);

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onImageUploaded]);

  return (
    <div className="space-y-4">
      <Label>Logo Institucional</Label>
      
      {/* Preview de la imagen */}
      <div className="relative aspect-square max-w-[220px] rounded-2xl shadow-lg overflow-hidden border-2 border-dashed border-gray-300">
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Preview del logo"
              className="w-full h-full object-cover"
              fill
              unoptimized={true}
            />
            {!disabled && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <ImageIcon className="h-20 w-20 text-gray-400" />
          </div>
        )}
      </div>

      {!disabled && (
        <div className="space-y-3">
          {/* Área de arrastrar y soltar */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            className={`
              relative border-2 border-dashed rounded-lg p-6 transition-colors
              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
            />
            
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">Subiendo imagen...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">
                      También puedes pegar una imagen desde el portapapeles
                    </p>
                    <p className="text-xs text-gray-400">
                      Formatos: JPEG, PNG, SVG, WEBP (máx. 20MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                  >
                    Seleccionar archivo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Botón para ingresar URL */}
          {!showUrlInput ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(true)}
              disabled={disabled || isUploading}
              className="w-full"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Ingresar URL de imagen
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit();
                    } else if (e.key === "Escape") {
                      setShowUrlInput(false);
                      setUrlInput("");
                    }
                  }}
                  disabled={disabled || isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput("");
                  }}
                  disabled={disabled || isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleUrlSubmit}
                disabled={disabled || isUploading || !urlInput.trim()}
                className="w-full"
              >
                Guardar URL
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

