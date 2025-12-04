import { BillingRule } from "@/types/billingRule"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Calendar, Clock2, DollarSign, Edit, Eye, Scale, Settings, SquareScissors, Trash2, User, UsersRound } from "@repo/ui/icons"
import { useQuery } from "convex/react"

interface BillingRuleCardProps {
    billingRule: BillingRule;
    openEdit: (itemData: BillingRule) => void;
    openView: (itemData: BillingRule) => void;
    openDelete: (itemData: BillingRule) => void;
    isUpdatingBillingRule: boolean;
    isDeletingBillingRule: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
}

export function BillingRuleCard({ billingRule, openEdit, openView, openDelete, isUpdatingBillingRule, isDeletingBillingRule, canUpdate = true, canDelete = true }: BillingRuleCardProps) {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    const user = useQuery(
        api.functions.users.getUserById,
        billingRule.updatedBy
            ? { userId: billingRule.updatedBy as Id<"user"> }
            : 'skip'
    );

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "late_fee": return "Recargo por mora";
            case "early_discount": return "Descuento anticipado";
            case "cutoff": return "Corte";
            default: return type;
        }
    };

    const getScopeLabel = (scope: string) => {
        switch (scope) {
            case "estandar": return "Estándar";
            case "becarios": return "Becarios";
            case "all_students": return "Todos los estudiantes";
            default: return scope;
        }
    };

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex flex-col sm:flex-row gap-3 items-center text-center sm:text-start justify-between">
                    <span>{billingRule.name}</span>
                    <div>
                        <Badge
                            variant={billingRule.status === "active" ? "default" : "secondary"}
                            className={billingRule.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                        >
                            {billingRule.status === "active" ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>

                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
                {billingRule.description && (
                    <div className="flex items-start gap-2">
                        <Scale className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed break-words">
                            <span className="inline">
                                {billingRule.description.length > 75
                                    ? billingRule.description.substring(0, 75) + "..."
                                    : billingRule.description}
                            </span>

                            {billingRule.description.length > 75 && (
                                <Badge
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openView(billingRule)
                                    }}
                                    className="ml-1 flex-shrink-0 bg-transparent text-black cursor-pointer hover:bg-black hover:text-white"
                                >
                                    más
                                </Badge>
                            )}
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        Tipo: {getTypeLabel(billingRule.type)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        Alcance: {getScopeLabel(billingRule.scope)}
                    </span>
                </div>

                {billingRule.lateFeeType && billingRule.lateFeeValue && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {billingRule.lateFeeType === "percentage" ? `${billingRule.lateFeeValue}%` : `$${billingRule.lateFeeValue}`}
                        </span>
                    </div>
                )}

                {(billingRule.startDay !== undefined && billingRule.endDay !== undefined) && (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            Días: {billingRule.startDay} - {billingRule.endDay}
                        </span>
                    </div>
                )}

                {billingRule.cutoffAfterDays && (
                    <div className="flex items-center gap-2">
                        <SquareScissors className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            Corte después de {billingRule.cutoffAfterDays} días
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock2 className="h-3 w-3" />
                    <span>Creado {formatDate(billingRule._creationTime)}</span>
                </div>

                {billingRule.updatedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock2 className="h-3 w-3" />
                        <span>Actualizado {formatDate(billingRule.updatedAt)}</span>
                    </div>
                )}

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
                        openView(billingRule)
                    }}
                    disabled={isUpdatingBillingRule || isDeletingBillingRule}
                    className="hover:scale-105 transition-transform cursor-pointer"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                {canUpdate && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            openEdit(billingRule);
                        }}
                        disabled={isUpdatingBillingRule || isDeletingBillingRule}
                        className="hover:scale-105 transition-transform cursor-pointer"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            openDelete(billingRule)
                        }}
                        disabled={isUpdatingBillingRule || isDeletingBillingRule}
                        className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}