import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Calendar, Edit, Eye, GraduationCap, Trash2, Users } from "@repo/ui/icons"
import { useQuery } from "convex/react"
import { Group } from "stores/groupStore"

interface GroupCardProps {
  group: Group;
  isUpdatingGroup: boolean;
  isDeletingGroup: boolean;
  openEdit: (itemData: Group) => void;
  openView: (itemData: Group) => void;
  openDelete: (itemData: Group) => void;
}

export function GroupCard({
  group,
  isUpdatingGroup,
  isDeletingGroup,
  openEdit,
  openView,
  openDelete,
}: GroupCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const user = useQuery(api.functions.users.getUserById,
    group.updatedBy ? { userId: group.updatedBy as Id<"user"> } : "skip"
  );

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader >
        <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex justify-between">
          <div className="space-y-1 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>{group.grade} {group.name}</span>
          </div>
          <Badge
            variant={group.status === 'active' ? 'default' : 'secondary'}
            className={group.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}>
            {group.status === "active" ? 'Activo' : 'Inactivo'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Creado</span>
            <span>{formatDate(group._creationTime)}</span>
          </div>
          {group.updatedAt && (
            <>
              <Calendar className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Actualizado</span>
                <span>{formatDate(group.updatedAt)}</span>
              </div>
            </>
          )}
        </div>

        {group.updatedBy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Actualizado por</span>
              <span>{user?.name} {user?.lastName}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-2 border-t mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            openView(group)
          }}
          disabled={isUpdatingGroup || isDeletingGroup}
          className="hover:scale-105 transition-transform cursor-pointer"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(group);
          }}
          disabled={isUpdatingGroup || isDeletingGroup}
          className="hover:scale-105 transition-transform cursor-pointer"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            openDelete(group)
          }}
          disabled={isUpdatingGroup || isDeletingGroup}
          className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
