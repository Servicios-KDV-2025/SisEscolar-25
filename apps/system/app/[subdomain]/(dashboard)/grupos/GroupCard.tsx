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

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800 hover:bg-green-100 flex-shrink-0 ml-2"
      : "flex-shrink-0 ml-2"
  }

  const user = useQuery(api.functions.users.getUserById,
    group.updatedBy ? { userId: group.updatedBy as Id<"user"> } : "skip"
  );

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <CardTitle className="text-lg font-semibold line-clamp-1">{group.grade} {group.name}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={getStatusColor(group.status)}>
              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
            </Badge>
          </div>

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
        </div>
      </CardContent>

      <CardFooter className="flex justify-end items-end gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openView(group)
          }}
          disabled={isUpdatingGroup || isDeletingGroup}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(group);
          }}
          disabled={isUpdatingGroup || isDeletingGroup}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            openDelete(group)
          }}
          disabled={isUpdatingGroup || isDeletingGroup}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
