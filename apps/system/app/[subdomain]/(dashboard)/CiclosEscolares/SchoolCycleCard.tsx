import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Calendar, Edit, Eye, GraduationCap, Trash2 } from "@repo/ui/icons"
import { CicloEscolar } from "stores/useSchoolCiclesStore"

interface SchoolCycleCardProps {
  ciclo: CicloEscolar;
  isUpdating: boolean;
  isDeleting: boolean;
  openEdit: (itemData: CicloEscolar) => void;
  openView: (itemData: CicloEscolar) => void;
  openDelete: (itemData: CicloEscolar) => void;
}

export function SchoolCycleCard({
  ciclo,
  isUpdating,
  isDeleting,
  openEdit,
  openView,
  openDelete,
}: SchoolCycleCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      case "inactive":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "archived":
        return "Archivado"
      case "inactive":
        return "Inactivo"
      default:
        return status
    }
  }

  const calculateDuration = (startDate: number, endDate: number) => {
    const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30))
    return `${months} meses`
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <CardTitle className="text-lg font-semibold line-clamp-1">{ciclo.name}</CardTitle>
          </div>
          <Badge variant="secondary" className={getStatusColor(ciclo.status)}>
            {getStatusText(ciclo.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Inicio:</span>
              <span className="font-medium">{formatDate(ciclo.startDate)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Fin:</span>
              <span className="font-medium">{formatDate(ciclo.endDate)}</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Duración:</span>
              <span className="font-medium">{calculateDuration(ciclo.startDate, ciclo.endDate)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-muted-foreground">Creado:</span>
              <span className="font-medium">{formatDate(ciclo.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end items-end gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openView(ciclo)
          }}
          disabled={isUpdating || isDeleting}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(ciclo)
          }}
          disabled={isUpdating || isDeleting}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openDelete(ciclo)
          }}
          disabled={isUpdating || isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}