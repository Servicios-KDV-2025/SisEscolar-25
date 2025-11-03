import { Clock, CheckCircle2, Users, Calendar, DollarSign, FileText, AlertTriangle, Percent, Scissors } from '@repo/ui/icons';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@repo/ui/components/shadcn/dialog';
import { Button } from '@repo/ui/components/shadcn/button';
import { ScrollArea } from '@repo/ui/components/shadcn/scroll-area';
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from 'lib/billing/constants';
import { ResultData } from '@/types/billingConfig';
import { BillingRule, BILLING_RULE_TYPES, BILLING_RULE_SCOPES, BILLING_RULE_STATUSES } from '@/types/billingRule';
import { useMemo } from 'react';
import { formatCurrency, formatDate } from 'lib/utils';
import { Badge } from '@repo/ui/components/shadcn/badge';

interface BillingResultsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: ResultData;
    billingRules: BillingRule[];
}

export function BillingResultsDialog({ isOpen, onClose, data, billingRules }: BillingResultsDialogProps) {
    const stats = useMemo(() => [
        {
            title: "Estudiantes",
            value: data.affectedStudents?.length || 0,
            icon: Users,
            trend: "Pagos generados",
            variant: "default" as const
        },
        {
            title: "Monto",
            value: `$${formatCurrency(data.paymentConfig.amount)} MXN`,
            icon: DollarSign,
            trend: `${RECURRENCE_TYPES[data.paymentConfig.recurrence_type]?.toLowerCase()}`,
            variant: "secondary" as const
        },
        {
            title: "Ciclo Escolar",
            value: data.paymentConfig.ciclo,
            icon: Clock,
            trend: `Ciclo escolar ${data.paymentConfig.cicloStatus === "active" ? "activo" : "inactivo"}`,
            variant: "destructive" as const
        },
        {
            title: "Vencimiento",
            value: data.paymentConfig.endDate,
            icon: Calendar,
            trend: "Fecha límite",
            variant: "default" as const
        }
    ], [data])

    const getStatusColor = (status: keyof typeof STATUS_TYPES) => {
        const colors = {
            required: 'bg-black text-white border-black-200',
            optional: 'bg-gray-50 text-gray-700 border-gray-200',
            inactive: 'bg-red-50 text-red-700 border-red-200'
        };
        return colors[status];
    };

    const getRuleIcon = (type: keyof typeof BILLING_RULE_TYPES) => {
        switch (type) {
            case 'late_fee':
                return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'early_discount':
                return <Percent className="w-4 h-4 text-green-500" />;
            case 'cutoff':
                return <Scissors className="w-4 h-4 text-red-500" />;
            default:
                return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    const appliedRules = useMemo(() => {
        if (!billingRules || !data.paymentConfig.ruleIds) return [];
        return data.paymentConfig.ruleIds
            .map(ruleId => billingRules.find(rule => rule._id === ruleId))
            .filter(Boolean) as BillingRule[];
    }, [billingRules, data.paymentConfig.ruleIds]);

    const dateStart = new Date(data.paymentConfig.startDate)
    const dateEnd = new Date(data.paymentConfig.endDate)

    return (
        <div className="p-2 sm:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[calc(100%-2rem)] sm:w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden p-0 gap-0 rounded-lg sm:rounded-xl">
                    <div className="relative bg-white border-b border-gray-300">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-1">
                                        Configuración Aplicada Exitosamente
                                    </DialogTitle>
                                    <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                        {data.message}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="h-[calc(95vh-180px)] sm:h-[calc(90vh-200px)]">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 space-y-5 sm:space-y-6 lg:space-y-8">
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                                    Resumen de la Operación
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                                    {stats.map((stat, index) => (
                                        <div
                                            key={index}
                                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                    {stat.title}
                                                </span>
                                                <div className="p-1 bg-gray-100 rounded">
                                                    <stat.icon className="h-3 w-3 text-gray-600" />
                                                </div>
                                            </div>
                                            <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                                {stat.value}
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">
                                                {stat.trend}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                        Detalles de la Configuración
                                    </h3>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-2 gap-4 p-4">
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                                Tipo de Pago
                                            </span>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {PAYMENT_TYPES[data.paymentConfig.type]}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                                Recurrencia
                                            </span>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {RECURRENCE_TYPES[data.paymentConfig.recurrence_type]}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                                Alcance
                                            </span>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {SCOPE_TYPES[data.paymentConfig.scope]}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                                                Estado
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${getStatusColor(data.paymentConfig.status)}`}>
                                                {STATUS_TYPES[data.paymentConfig.status]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(appliedRules?.length ?? 0) > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                            Políticas de Cobro Aplicadas
                                        </h3>
                                    </div>

                                    <div className="space-y-3 sm:space-y-4">
                                        {appliedRules?.map((rule) => (
                                            <div
                                                key={rule._id}
                                                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getRuleIcon(rule.type)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                                            <div>
                                                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                                                                    {rule.name}
                                                                </h4>
                                                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                                                    {rule.description || 'Sin descripción'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Badge
                                                                    variant={rule.status === "active" ? "default" : "secondary"}
                                                                    className={rule.status === "active" ? "bg-green-600 text-white flex-shrink-0 ml-2" : "flex-shrink-0 ml-2 bg-gray-600/70 text-white"}
                                                                >
                                                                    {BILLING_RULE_STATUSES[rule.status]}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <div className="space-y-2">
                                                                {rule.startDay && rule.endDay && rule.type === 'late_fee' && rule.lateFeeType && rule.lateFeeValue && (
                                                                    <>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Período de Aplicación:
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                                Comieza en el día {formatDate(new Date(dateEnd).setDate(new Date(dateEnd).getDate() + rule.startDay))} y termina en el día {formatDate(new Date(dateEnd).setDate(new Date(dateEnd).getDate() + rule.endDay))}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Período :
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                                Días {rule.startDay} - {rule.endDay}
                                                                            </span>

                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Recargo:
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                                {rule.lateFeeType === 'fixed' ? '$' : ''}{rule.lateFeeValue}{rule.lateFeeType === 'percentage' ? '%' : ''}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {rule.startDay && rule.endDay && rule.type === 'early_discount' && rule.lateFeeType && rule.lateFeeValue && (
                                                                    <>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Período de Aplicación:
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                                Comieza en el día {formatDate(new Date(dateStart).setDate(new Date(dateStart).getDate() + rule.startDay))} y termina en el día {formatDate(new Date(dateStart).setDate(new Date(dateStart).getDate() + rule.endDay))}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Período :
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                                Días {rule.startDay} - {rule.endDay}
                                                                            </span>

                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                Descuento:
                                                                            </span>
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                                {rule.lateFeeType === 'fixed' ? '$' : ''}{rule.lateFeeValue}{rule.lateFeeType === 'percentage' ? '%' : ''}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {rule.cutoffAfterDays && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Corte:
                                                                        </span>
                                                                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                            Después de {rule.cutoffAfterDays} días de que no se haya realizado el pago
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                        Tipo:
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                        {BILLING_RULE_TYPES[rule.type]}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                        Alcance:
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                                                        {BILLING_RULE_SCOPES[rule.scope]}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                        Alumnado Objetivo
                                    </h3>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                                    {data.affectedStudents?.length || 0} estudiante(s)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {data.affectedStudents?.map((payment) => (
                                    <div key={payment.paymentId}
                                        className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                    {payment.studentName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold leading-tight line-clamp-3 break-words text-sm sm:text-base text-gray-900 mb-1">
                                                        {payment.studentName}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                            {payment.enrollment}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                            {payment.group}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="inline-flex justify-center items-center gap-1.5 w-9 h-9 rounded-full text-xs sm:text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(data.completedBillings?.length ?? 0) > 0 && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
                                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                                Cobros pagados
                                            </h3>
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                                            {data.completedBillings?.length ?? 0} estudiante(s)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {data.completedBillings?.map((completed, index) => (
                                            <div key={index}
                                                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                                                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                            {completed.student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold leading-tight line-clamp-3 break-words text-sm sm:text-base text-gray-900 mb-1">
                                                                {completed.student.name} {completed.student.lastName || ''}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                                    {completed.student.enrollment}
                                                                </span>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                                    Pagado
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign className="w-3 h-3 text-gray-500" />
                                                                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                                                                        ${formatCurrency(completed.billing.totalAmount || completed.billing.amount)} MXN
                                                                    </span>
                                                                </div>
                                                                {completed.billing.paidAt && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-600">
                                                                            Pagado el {formatDate(completed.billing.paidAt)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className="inline-flex justify-center items-center gap-1.5 w-9 h-9 rounded-full text-xs sm:text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                                                        <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
                            <Button
                                onClick={onClose}
                                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
