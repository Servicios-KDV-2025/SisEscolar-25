'use client'

import React, { useState, useEffect } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/shadcn/dialog'
import { Button } from '@repo/ui/components/shadcn/button'
import { Form } from '@repo/ui/components/shadcn/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/shadcn/alert-dialog'
import { Pencil, Plus, Trash2, Eye } from 'lucide-react'

export type CrudOperation = 'create' | 'edit' | 'delete' | 'view'

// Tipo para los datos que incluyen ID
export interface WithId {
  _id: string
}

// Tipo para los datos del formulario
export type FormData = Record<string, unknown>

export interface CrudDialogProps {
  // Configuración básica
  operation: CrudOperation
  title: string
  description?: string
  schema: z.ZodSchema
  defaultValues?: Record<string, unknown>

  // Datos y estado
  data?: Record<string, unknown> & Partial<WithId>
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void

  // Operaciones
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onDelete?: (id: string) => Promise<void>

  // Renderizado
  trigger?: React.ReactNode
  children: (form: UseFormReturn<Record<string, unknown>>, operation: CrudOperation) => React.ReactNode

  // Configuración adicional
  deleteConfirmationTitle?: string
  deleteConfirmationDescription?: string
  submitButtonText?: string
  cancelButtonText?: string
  deleteButtonText?: string

  // Estados de carga
  isLoading?: boolean
  isSubmitting?: boolean
  isDeleting?: boolean

  // Callbacks
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function CrudDialog({
  operation,
  title,
  description,
  schema,
  defaultValues,
  data,
  isOpen,
  onOpenChange,
  onSubmit,
  onDelete,
  trigger,
  children,
  deleteConfirmationTitle = '¿Estás seguro?',
  deleteConfirmationDescription = 'Esta acción no se puede deshacer.',
  submitButtonText,
  cancelButtonText = 'Cancelar',
  deleteButtonText = 'Eliminar',
  isLoading = false,
  isSubmitting = false,
  isDeleting = false,
  onSuccess,
  onError
}: CrudDialogProps) {
  const [open, setOpen] = useState(false)
  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false)
  const [isInternalDeleting, setIsInternalDeleting] = useState(false)

  const isControlled = isOpen !== undefined
  const dialogOpen = isControlled ? isOpen : open
  const setDialogOpen = isControlled ? onOpenChange : setOpen

  const form = useForm<Record<string, unknown>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues || {}
  })

  // Actualizar valores del formulario cuando cambian los datos
  useEffect(() => {
    if ((operation === 'edit' || operation === 'view') && data) {
      form.reset(data)
    } else if (operation === 'create') {
      form.reset(defaultValues || {})
    }
  }, [data, form, operation, defaultValues])

  // Resetear formulario cuando se cierra el diálogo
  useEffect(() => {
    if (!dialogOpen) {
      form.reset(defaultValues || {})
    }
  }, [dialogOpen, form, defaultValues])

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      setIsInternalSubmitting(true)
      await onSubmit(values)
      setDialogOpen?.(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error('Error', {
        description: `Ocurrió un error al ${operation === 'create' ? 'crear' : 'actualizar'}`
      })
      onError?.(error)
    } finally {
      setIsInternalSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !data || !data._id) return

    try {
      setIsInternalDeleting(true)
      await onDelete(data._id)
      setDialogOpen?.(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Error', {
        description: 'Ocurrió un error al eliminar'
      })
      onError?.(error)
    } finally {
      setIsInternalDeleting(false)
    }
  }

  const getSubmitButtonText = () => {
    if (submitButtonText) return submitButtonText
    switch (operation) {
      case 'create': return 'Crear'
      case 'edit': return 'Actualizar'
      case 'view': return 'Cerrar'
      default: return 'Guardar'
    }
  }

  const getIcon = () => {
    switch (operation) {
      case 'create': return <Plus className="h-4 w-4" />
      case 'edit': return <Pencil className="h-4 w-4" />
      case 'delete': return <Trash2 className="h-4 w-4" />
      case 'view': return <Eye className="h-4 w-4" />
      default: return null
    }
  }

  const isSubmittingState = isSubmitting || isInternalSubmitting
  const isDeletingState = isDeleting || isInternalDeleting

  // Para operación de eliminación, mostrar AlertDialog
  if (operation === 'delete') {
    return (
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {trigger && (
          <AlertDialogTrigger asChild>
            {trigger}
          </AlertDialogTrigger>
        )}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirmationTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmationDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingState}>
              {cancelButtonText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingState}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
            >
              {isDeletingState ? 'Eliminando...' : deleteButtonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Para operaciones de crear, editar y ver, mostrar Dialog
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              {children(form, operation)}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen?.(false)}
                disabled={isSubmittingState}
              >
                {cancelButtonText}
              </Button>
              {operation !== 'view' && (
                <Button
                  type="submit"
                  disabled={isSubmittingState || isLoading}
                >
                  {isSubmittingState ? 'Guardando...' : getSubmitButtonText()}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Hook personalizado para facilitar el uso del CrudDialog
export function useCrudDialog(
  schema: z.ZodSchema,
  defaultValues?: Record<string, unknown>
) {
  const [isOpen, setIsOpen] = useState(false)
  const [operation, setOperation] = useState<CrudOperation>('create')
  const [data, setData] = useState<(Record<string, unknown> & Partial<WithId>) | undefined>()

  const openCreate = () => {
    setOperation('create')
    setData(undefined)
    setIsOpen(true)
  }

  const openEdit = (itemData: Record<string, unknown> & Partial<WithId>) => {
    setOperation('edit')
    setData(itemData)
    setIsOpen(true)
  }

  const openView = (itemData: Record<string, unknown> & Partial<WithId>) => {
    setOperation('view')
    setData(itemData)
    setIsOpen(true)
  }

  const openDelete = (itemData: Record<string, unknown> & Partial<WithId>) => {
    setOperation('delete')
    setData(itemData)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setData(undefined)
  }

  return {
    isOpen,
    operation,
    data,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
    schema,
    defaultValues
  }
} 