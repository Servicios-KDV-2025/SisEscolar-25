import { BillingConfigType } from "@/types/billingConfig"
import { BillingRule } from "@/types/billingRule"
import { SchoolCycleType } from "@/types/temporalSchema"
import { api } from "@repo/convex/convex/_generated/api"
import { Id } from "@repo/convex/convex/_generated/dataModel"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Button } from "@repo/ui/components/shadcn/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { DollarSign, Edit, Eye, Settings, Trash2, Calendar, Users, Repeat, Scale, Clock2, User } from "@repo/ui/icons"
import { useQuery } from "convex/react"
import { PAYMENT_TYPES, RECURRENCE_TYPES, STATUS_TYPES } from "lib/billing/constants"

interface BillingConfigCardProps {
    billingConfig: BillingConfigType;
    openEdit: (itemData: BillingConfigType) => void;
    openView: (itemData: BillingConfigType) => void;
    openDelete: (itemData: BillingConfigType) => void;
    canUpdateBillingConfig: boolean;
    canDeleteBillingConfig: boolean;

    isUpdatingBillingConfig: boolean;
    isDeletingBillingConfig: boolean;
    schoolCycles?: SchoolCycleType[];
    billingRules?: BillingRule[];
}

export function BillingConfigCard({
    billingConfig,
    openEdit,
    openView,
    openDelete,
    isUpdatingBillingConfig,
    isDeletingBillingConfig,
    canUpdateBillingConfig,
    canDeleteBillingConfig,
    schoolCycles,
    billingRules
}: BillingConfigCardProps) {
    const user = useQuery(
        api.functions.users.getUserById,
        billingConfig.updatedBy
            ? { userId: billingConfig.updatedBy as Id<"user"> }
            : 'skip'
    );
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    const getSchoolCycleName = (cycleId: string) => {
        return schoolCycles?.find(c => c._id === cycleId)?.name ?? "N/A"
    }

    const getScopeDisplay = (config: BillingConfigType) => {
        if (config.scope === "all_students") return "Todos los estudiantes"
        if (config.scope === "specific_groups") {
            return `${config.targetGroup?.length ?? 0} grupo(s)`
        }
        if (config.scope === "specific_grades") {
            return `${config.targetGrade?.length ?? 0} grado(s)`
        }
        if (config.scope === "specific_students") {
            return `${config.targetStudent?.length ?? 0} estudiante(s)`
        }
        return "N/A"
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            required: "default",
            optional: "secondary",
            inactive: "destructive"
        } as const

        return (
            <Badge variant={variants[status as keyof typeof variants]}>
                {STATUS_TYPES[status as keyof typeof STATUS_TYPES]}
            </Badge>
        )
    }

    const [dayStart, monthStart] = [new Date(billingConfig.startDate).getDate(), new Date(billingConfig.startDate).getMonth() + 1];
    const [dayEnd, monthEnd] = [new Date(billingConfig.endDate).getDate(), new Date(billingConfig.endDate).getMonth() + 1];
    
    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 break-words flex justify-between items-start">
                    <span>{PAYMENT_TYPES[billingConfig.type as keyof typeof PAYMENT_TYPES]} {dayStart}/{monthStart} - {dayEnd}/{monthEnd}</span>
                    {getStatusBadge(billingConfig.status)}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold text-green-600">
                        ${billingConfig.amount.toLocaleString('es-MX')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {RECURRENCE_TYPES[billingConfig.recurrence_type as keyof typeof RECURRENCE_TYPES]}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {getScopeDisplay(billingConfig)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {getSchoolCycleName(billingConfig.schoolCycleId)}
                    </span>
                </div>

                {billingConfig.ruleIds && billingConfig.ruleIds.length > 0 && (
                    <div className="flex items-start gap-2">
                        <Scale className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                            {billingConfig.ruleIds.map((ruleId) => {
                                const rule = billingRules?.find(r => r._id === ruleId);
                                return rule ? (
                                    <Badge key={ruleId} variant="outline" className="text-xs">
                                        {rule.name}
                                    </Badge>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(billingConfig.startDate)} - {formatDate(billingConfig.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock2 className="h-3 w-3" />
                    <span>Creado {formatDate(billingConfig._creationTime)}</span>
                </div>

                {billingConfig.updatedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock2 className="h-3 w-3" />
                        <span>Actualizado {formatDate(billingConfig.updatedAt)}</span>
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
                        openView(billingConfig)
                    }}
                    disabled={isUpdatingBillingConfig || isDeletingBillingConfig}
                    className="hover:scale-105 transition-transform cursor-pointer"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                {canUpdateBillingConfig && (<Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        openEdit(billingConfig);
                    }}
                    disabled={isUpdatingBillingConfig || isDeletingBillingConfig}
                    className="hover:scale-105 transition-transform cursor-pointer"
                >
                    <Edit className="h-4 w-4" />
                </Button>)}
                {canDeleteBillingConfig && (<Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        openDelete(billingConfig)
                    }}
                    disabled={isUpdatingBillingConfig || isDeletingBillingConfig}
                    className="hover:scale-105 transition-transform cursor-pointer text-destructive hover:text-destructive bg-white"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>)}
            </CardFooter>
        </Card>
    )
}