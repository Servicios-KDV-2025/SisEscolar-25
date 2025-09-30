import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { BookOpen, Clock, Edit, Eye, GraduationCap, Trash2, User } from "@repo/ui/icons"
import { useQuery } from "convex/react"

interface Subject extends Record<string, unknown> {
    _id: string
    _creationTime: number,
    schoolId: string
    name: string
    description?: string
    credits?: number
    status: "active" | "inactive"
    updatedAt: number
    updatedBy: string
}

interface SubjectCardProps {
    subject: Subject;
    openEdit: (itemData: Subject) => void;
    openView: (itemData: Subject) => void;
    openDelete: (itemData: Subject) => void;
    canUpdateSubject: boolean;
    canDeleteSubject: boolean;
    
    isUpdatingSubject: boolean;
    isDeletingSubject: boolean;
}

export function SubjectCard({ subject, openEdit, openView, openDelete, isUpdatingSubject, isDeletingSubject,canUpdateSubject,
    canDeleteSubject, }: SubjectCardProps) {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    const user = useQuery(
        api.functions.users.getUserById,
        subject.updatedBy
            ? { userId: subject.updatedBy as Id<"user"> }
            : 'skip'
    );

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex justify-between">
                    <span>{subject.name}</span>
                    <Badge
                        variant={subject.status === "active" ? "default" : "secondary"}
                        className={subject.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                    >
                        {subject.status === "active" ? 'Activo' : 'Inactivo'}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
                {subject.description && (
                    <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words">{subject.description}</p>
                    </div>
                )}

                {subject.credits && (
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {subject.credits} {subject.credits === 1 ? "Credito" : "Creditos"}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Creado {formatDate(subject._creationTime)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Actualizado {formatDate(subject.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{user?.name} {user?.lastName}</span>
                </div>

            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-2 border-t mt-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        openView(subject)
                    }}
                    disabled={isUpdatingSubject || isDeletingSubject}
                    className="hover:scale-105 transition-transform cursor-pointer"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                {(canUpdateSubject && <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        openEdit({
                            ...subject,
                            creditos:
                                subject.credits !== undefined &&
                                    subject.credits !== null
                                    ? String(subject.credits)
                                    : undefined,
                        });
                    }}
                    disabled={isUpdatingSubject || isDeletingSubject}
                    className="hover:scale-105 transition-transform cursor-pointer"
                >
                    <Edit className="h-4 w-4" />
                </Button>)}
                {canDeleteSubject && (<Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        openDelete(subject)
                    }}
                    disabled={isUpdatingSubject || isDeletingSubject}
                    className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>)}
            </CardFooter>
        </Card>
    )
}
