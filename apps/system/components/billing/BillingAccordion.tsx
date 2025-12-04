"use client"
import { useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion"
import { Checkbox } from "@repo/ui/components/shadcn/checkbox"
import { FloatingBilling } from "./FloatingBilling"
import { Estudiante, EstadoConfig, EstadoBillingConfig, BillingStatusConfig } from "@/types/billing"
import { School, Equal, Plus, Minus, GraduationCap, Calendar, CreditCard, DollarSign, CheckCircle, SquareCheck, AlertTriangle, Info, Backpack, BanknoteArrowUp } from "@repo/ui/icons"
import { formatCurrency, formatDate, formatFecha } from "lib/utils"
import { PAYMENT_TYPES } from "lib/billing/constants"
import { Button } from "@repo/ui/components/shadcn/button"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/shadcn/popover"
import { BILLING_RULE_SCOPES, BillingRule, SCHOOLAR_TYPES } from "@/types/billingRule"
import { Badge } from "@repo/ui/components/shadcn/badge"


interface BillingAccordionProps {
    filteredEstudiantes: Estudiante[]
    selectedBillings: string[]
    billingRules: BillingRule[];
    handleBillingSelection: (paymentId: string, checked: boolean) => void
    handleRealizarPagos: () => void
    onClear: () => void
    getEstadoConfig: (estado: string) => EstadoConfig
    getEstadoBillingConfig: (estado: string) => EstadoBillingConfig
    getBillingStatusConfig: (estado: string) => BillingStatusConfig | undefined
    currentRole?: string | null
}

export function BillingAccordion({
    filteredEstudiantes,
    selectedBillings,
    billingRules,
    handleBillingSelection,
    handleRealizarPagos,
    onClear,
    getEstadoConfig,
    getEstadoBillingConfig,
    getBillingStatusConfig,
    currentRole,
}: BillingAccordionProps) {
    const estudianteCalculations = useMemo(() =>
        filteredEstudiantes.map((estudiante) => {
            const studentBillings = estudiante.pagos || []
            const config = getEstadoConfig(estudiante.estado)
            const Icon = config.icon
            const hasSelectedBillings = studentBillings.some((pago) => pago?.id && selectedBillings?.includes(pago.id))

            const selectedBillingsData = studentBillings.filter((p) => p?.id && selectedBillings?.includes(p.id))
            const totalSelected = selectedBillingsData.reduce((sum, p) => sum + p.totalAmount, 0)
            const totalBase = selectedBillingsData.reduce((sum, p) => sum + p.amount, 0)
            const totalDiscounts = selectedBillingsData.reduce((sum, p) => sum + p.totalDiscount, 0)
            const totalFees = selectedBillingsData.reduce((sum, p) => sum + p.lateFee, 0)

            return {
                estudiante,
                studentBillings,
                config,
                Icon,
                hasSelectedBillings,
                selectedBillingsData,
                totalSelected,
                totalBase,
                totalDiscounts,
                totalFees
            }
        }),
        [filteredEstudiantes, selectedBillings, getEstadoConfig]
    )

    const globalTotals = useMemo(() => {
        const allSelectedBillings = filteredEstudiantes.flatMap(estudiante =>
            (estudiante.pagos || []).filter(pago => pago?.id && selectedBillings?.includes(pago.id))
        )
        return {
            totalBase: allSelectedBillings.reduce((sum, p) => sum + p.amount, 0),
            totalDiscounts: allSelectedBillings.reduce((sum, p) => sum + p.totalDiscount, 0),
            totalFees: allSelectedBillings.reduce((sum, p) => sum + p.lateFee, 0),
            totalSelected: allSelectedBillings.reduce((sum, p) => sum + p.totalAmount, 0)
        }
    }, [filteredEstudiantes, selectedBillings])

    return (
        <>
            <Accordion type="single" collapsible className="space-y-4">
                {estudianteCalculations.map(({ estudiante, studentBillings, config, Icon, hasSelectedBillings }) => {

                    return (
                        <AccordionItem
                            key={estudiante.id}
                            value={estudiante.id}
                            className={`border rounded-xl transition-all duration-300 shadow-sm ${hasSelectedBillings
                                ? "border-blue-300 bg-blue-50/50 shadow-lg ring-1 ring-blue-200"
                                : estudiante.estado === "retrasado"
                                    ? "border-red-200 bg-red-50/30"
                                    : "border-gray-200 bg-gray-50/30 hover:shadow-md"
                                }`}
                        >
                            <AccordionTrigger
                                className={`px-4 py-4 hover:no-underline rounded-xl transition-colors cursor-pointer ${hasSelectedBillings
                                    ? "hover:bg-blue-100/70"
                                    : estudiante.estado === "retrasado"
                                        ? "hover:bg-red-100/50"
                                        : estudiante.estado === "moroso"
                                            ? "hover:bg-yellow-100/50"
                                            : "hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row w-full">
                                    <div className={`hidden sm:flex w-1 h-16 lg:h-20 mr-3 ${config.accentColor} ${config.hoverAccentColor} rounded-full flex-shrink-0 transition-colors duration-300`} />
                                    <div className={`sm:hidden w-25 h-1 mt-1 mb-3 ${config.accentColor} ${config.hoverAccentColor} rounded-full flex-shrink-0 transition-colors duration-300`} />
                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="flex flex-col">
                                                <div className="flex min-w-0 flex-col sm:flex-row sm:gap-1">
                                                    <h3 className="text-lg lg:text-xl font-semibold leading-tight line-clamp-3 break-words text-gray-900 mb-1" title={estudiante.nombre}>
                                                        {estudiante.nombre}
                                                    </h3>
                                                    <div className="flex flex-wrap sm:flex mb-3 gap-2 mt-3 sm:mt-0">
                                                        <div className="flex items-center gap-2 sm:ml-2 mb-1">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                                                            >
                                                                <Icon className="w-3.5 h-3.5" />
                                                                {config.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:ml-2 mb-1">
                                                            <Badge variant="outline" className="gap-1.5 rounded-lg px-3 bg-white py-1 font-medium">
                                                                <Backpack className="w-3.5 h-3.5" />
                                                                {SCHOOLAR_TYPES[estudiante?.scholarshipType]} {estudiante.scholarshipType === "active" ? `con ${estudiante.scholarshipPercentage}%` : ``}
                                                            </Badge>
                                                        </div>
                                                    </div>


                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <School className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium">{estudiante.matricula}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium">
                                                            Grupo: {estudiante.grado} {estudiante.grupo}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="font-semibold text-gray-700">
                                                            {studentBillings.length} cobro{studentBillings.length > 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                    {(estudiante.diasRetraso > 0 || estudiante.credit > 0) && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {estudiante.diasRetraso > 0 && (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
                                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                                    {estudiante.diasRetraso} días de retraso
                                                                </div>
                                                            )}
                                                            {estudiante.credit > 0 && (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                                                                    <DollarSign className="w-3.5 h-3.5" />
                                                                    Crédito disponible: ${formatCurrency(estudiante.credit)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 text-left md:text-right">
                                                <div className="text-sm text-gray-500 mb-1">Monto Total</div>
                                                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                                    ${formatCurrency(estudiante.montoColegiatura)}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">MXN</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </AccordionTrigger>

                            <AccordionContent className="px-2 sm:px-5 lg:px-6 pb-6">
                                <div className="border-t border-gray-100 pt-5">
                                    <div className="mb-5">
                                        <h3 className="text-base font-semibold text-gray-900 mb-1">Detalle de Cobros</h3>
                                        <p className="text-sm text-gray-500">
                                            {currentRole === "auditor" ? "Vista de solo lectura" : "Selecciona los pagos que deseas procesar"}
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        {studentBillings.map((pago) => {
                                            const isBillingSelected = !!(pago?.id && selectedBillings?.includes(pago.id))
                                            const isPaid = pago.estado === "Pagado"
                                            const statusConfig = getBillingStatusConfig(pago.estado)
                                            const config = getEstadoBillingConfig(pago.statusBilling)
                                            const StatusIcon = statusConfig?.icon || CheckCircle

                                            const politicas = billingRules.filter(objeto =>
                                                pago.ruleIds && Array.isArray(pago.ruleIds) && pago.ruleIds.includes(objeto._id)
                                            );
                                            return (
                                                <div
                                                    key={pago.id}
                                                    className={`rounded-lg border transition-all duration-200 ${isBillingSelected
                                                        ? "border-blue-400 bg-blue-50/30 shadow-md"
                                                        : isPaid
                                                            ? "border-emerald-200 bg-emerald-50/20"
                                                            : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <div className="p-4 space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            {!isPaid ? (
                                                                <Checkbox
                                                                    checked={isBillingSelected}
                                                                    onCheckedChange={(checked) => handleBillingSelection(pago.id, checked as boolean)}
                                                                    disabled={isPaid || currentRole === "auditor"}
                                                                    className="mt-1.5 border-gray-800 cursor-pointer"
                                                                />
                                                            ) : <SquareCheck className="mt-1.5 text-green-400 h-5 w-5" />}

                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                                    <div>
                                                                        <h5 className="text-lg font-semibold line-clamp-5 text-gray-900">
                                                                            <span>{PAYMENT_TYPES[pago.tipo as keyof typeof PAYMENT_TYPES]} {formatFecha(pago.startDate)} - {formatFecha(pago.endDate)}</span>
                                                                        </h5>

                                                                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                                                                            <div className="flex items-center gap-1">
                                                                                <Calendar className="w-4 h-4" />
                                                                                <span>Vence: <span className="font-medium">{pago.fechaVencimiento}</span></span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <DollarSign className="w-4 h-4" />
                                                                                <span>Monto Base: <span className="font-medium">${formatCurrency(pago.amount)} MXN</span></span>
                                                                            </div>
                                                                            {(pago.estado === "Pagado" || pago.estado === "Parcial") && (
                                                                                <div className="flex items-center gap-1">
                                                                                    <BanknoteArrowUp className="w-4 h-4" />
                                                                                    <span>{pago.estado === "Pagado" ? "Pagado: " : "Último pago: "}<span className="font-medium">{pago.paidAt}</span></span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-start mr-2 sm:text-right">
                                                                        <div className="text-xs text-gray-500">
                                                                            {pago.estado === "Pagado" ? "Pagado" : "Total a pagar"}
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-gray-900">
                                                                            ${formatCurrency(pago.amountOutstanding ?? 0)}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">MXN</div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {config && (
                                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                                                                            <Icon className="w-3.5 h-3.5" />
                                                                            {config.label}
                                                                        </span>
                                                                    )}
                                                                    {statusConfig && (
                                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                                            <StatusIcon className="w-3 h-3" />
                                                                            {pago.estado}
                                                                        </span>
                                                                    )}
                                                                    {pago.diasRetraso > 0 && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            {pago.diasRetraso} días retraso
                                                                        </span>
                                                                    )}
                                                                    {pago.ruleIds?.length > 0 && (
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-7 cursor-pointer px-3 text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-50 border-gray-200 text-gray-700 hover:from-gray-100 hover:to-gray-100 hover:border-gray-300 shadow-sm transition-all duration-200"
                                                                                >
                                                                                    <Info className="w-3.5 h-3.5 mr-1.5" />
                                                                                    <span>Políticas</span>

                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent
                                                                                className="w-[95vw] sm:w-96 max-w-md p-0 shadow-xl border-0 bg-white/95 backdrop-blur-sm"
                                                                                align="start"
                                                                                side="bottom"
                                                                                sideOffset={4}
                                                                            >
                                                                                <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 px-3 sm:px-4 py-3">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                                                            <Info className="w-4 h-4 text-gray-600" />
                                                                                        </div>
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                                                                                                Políticas de Cobro
                                                                                            </h4>
                                                                                            <p className="text-xs text-gray-600 truncate">
                                                                                                {politicas.length} política{politicas.length > 1 ? 's' : ''} aplicada{politicas.length > 1 ? 's' : ''} a este cobro
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="max-h-60 sm:max-h-80 overflow-y-auto p-3 sm:p-4 space-y-3">
                                                                                    {politicas.map((rule, index) => {
                                                                                        const dateDiscountEnd = new Date(pago.startDate)
                                                                                        const feeText = rule.lateFeeType === 'percentage'
                                                                                            ? `${rule.lateFeeValue}% del monto total`
                                                                                            : `$${formatCurrency(rule?.lateFeeValue || 0)} MXN fijos`;
                                                                                        const getRuleDescription = () => {
                                                                                            switch (rule.type) {
                                                                                                case 'early_discount':
                                                                                                    return `Se aplicará un descuento anticipado del ${feeText} durante el período del cobro (${formatDate(new Date(dateDiscountEnd).setDate(new Date(dateDiscountEnd).getDate() + (rule.startDay ?? 0)))} al ${formatDate(new Date(dateDiscountEnd).setDate(new Date(dateDiscountEnd).getDate() + (rule.endDay ?? 0)))}), incentivando el pago temprano.`;
                                                                                                case 'late_fee':
                                                                                                    return `En caso de retraso, se aplicará un recargo por mora de ${feeText} cada día a partir del día ${rule.startDay || 0} ${(rule.startDay || 0) !== 1 ? 's' : ''} después de la fecha de vencimiento (${formatDate(new Date(pago.endDate).setDate(new Date(pago.endDate).getDate()))}).`;
                                                                                                case 'cutoff':
                                                                                                    return `Si el cobro permanece pendiente por más de ${rule.cutoffAfterDays} día${rule.cutoffAfterDays !== 1 ? 's' : ''} después de la fecha límite (${formatDate(new Date(pago.endDate).setDate(new Date(pago.endDate).getDate()))}), será automáticamente suspendido.`;
                                                                                                default:
                                                                                                    return rule.description || 'Política de cobro especial aplicada a este período.';
                                                                                            }
                                                                                        };

                                                                                        return (
                                                                                            <div
                                                                                                key={rule._id}
                                                                                                className="relative p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
                                                                                            >
                                                                                                <div className="flex items-start gap-3">
                                                                                                    <div className="flex-1 min-w-0">
                                                                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
                                                                                                            <h5 className="font-semibold text-sm text-gray-900 leading-tight break-words">
                                                                                                                {rule.name}
                                                                                                            </h5>
                                                                                                        </div>

                                                                                                        <p className="text-xs text-gray-700 leading-relaxed break-words">
                                                                                                            {getRuleDescription()}
                                                                                                        </p>

                                                                                                        {rule.type === 'late_fee' && rule.lateFeeValue && (
                                                                                                            <div className="mt-2 flex items-center gap-2">
                                                                                                                <span className="text-xs font-medium text-gray-500">Recargo:</span>
                                                                                                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                                                                                                    {rule.lateFeeType === 'percentage' ? `${rule.lateFeeValue}%` : `$${formatCurrency(rule.lateFeeValue || 0)} MXN`}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        )}

                                                                                                        {rule.type === 'early_discount' && rule.lateFeeValue && (
                                                                                                            <div className="mt-2 flex items-center gap-2">
                                                                                                                <span className="text-xs font-medium text-gray-500">Descuento:</span>
                                                                                                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                                                                                    {rule.lateFeeType === 'percentage' ? `${rule.lateFeeValue}%` : `$${formatCurrency(rule.lateFeeValue || 0)} MXN`}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        )}

                                                                                                        {rule.type === 'cutoff' && rule.cutoffAfterDays && (
                                                                                                            <div className="mt-2 flex items-center gap-2">
                                                                                                                <span className="text-xs font-medium text-gray-500">Días de tolerancia:</span>
                                                                                                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                                                                                                    {rule.cutoffAfterDays} día{rule.cutoffAfterDays !== 1 ? 's' : ''}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        )}

                                                                                                        <div className="mt-2 flex items-center gap-2">
                                                                                                            <span className="text-xs font-medium text-gray-500">Aplica:</span>
                                                                                                            <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                                                                                                                {BILLING_RULE_SCOPES[rule.scope]}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {index < politicas.length - 1 && (
                                                                                                    <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-300 rounded-full"></div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>

                                                                                <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
                                                                                    <p className="text-xs text-gray-600 text-center leading-relaxed">
                                                                                        Estas políticas se aplicarán automáticamente según las condiciones establecidas
                                                                                    </p>
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(pago.totalDiscount > 0 || pago.lateFee > 0 || pago.estado === "Pagado") && (
                                                            <Accordion type="single" collapsible className="w-full">
                                                                <AccordionItem value="calculation" className="border-none">
                                                                    <AccordionTrigger className="py-2 px-2 sm:px-8 hover:bg-gray-50 rounded-lg text-sm font-medium cursor-pointer text-gray-700">
                                                                        Ver desglose del cálculo
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="pb-3 pt-1">
                                                                        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                                                                            <div className="flex flex-wrap justify-between items-center pb-2 border-b">
                                                                                <span className="text-sm font-medium text-gray-600">Monto base:</span>
                                                                                <span className="font-semibold">${formatCurrency(pago.amount)}</span>
                                                                            </div>

                                                                            {pago.appliedDiscounts?.length > 0 && (
                                                                                <div className="space-y-2">
                                                                                    {pago.appliedDiscounts.map((discount, idx) => (
                                                                                        <div key={idx} className="flex flex-wrap justify-between items-center py-2 px-3 bg-green-50 rounded-md">
                                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                                <Minus className="w-4 h-4 text-green-700" />
                                                                                                <span className="font-medium text-sm">
                                                                                                    {discount.type === "scholarship" ? "Beca" : "Descuento"}
                                                                                                    {discount.percentage && ` (${discount.percentage}%)`}
                                                                                                </span>
                                                                                            </div>
                                                                                            <span className="font-semibold text-green-700">
                                                                                                -${formatCurrency(discount.amount)}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {pago.lateFee > 0 && (
                                                                                <div className="flex flex-wrap justify-between items-center py-2 px-3 bg-red-50 rounded-md">
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <Plus className="w-4 h-4 text-red-700" />
                                                                                        <div>
                                                                                            <div className="font-medium text-sm">Recargo por mora</div>
                                                                                            <div className="text-xs text-red-600">{pago.diasRetraso} días retraso</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="font-semibold text-red-700">
                                                                                        +${formatCurrency(pago.lateFee)}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {pago.payments?.length > 0 && (
                                                                                <div className="space-y-2">
                                                                                    {pago.payments.map((payment, idx) => (
                                                                                        <div key={idx} className="flex flex-wrap justify-between items-center py-2 px-3 bg-green-50 rounded-md">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Minus className="w-4 h-4 text-green-700" />
                                                                                                <span className="font-medium text-sm">
                                                                                                    Pago
                                                                                                </span>
                                                                                            </div>
                                                                                            <span className="font-semibold text-green-700">
                                                                                                -${formatCurrency(payment.amount)}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            <div className="pt-3 border-t-2 border-gray-200">
                                                                                <div className="flex flex-wrap justify-between items-center py-2 px-3 bg-white rounded-md border">
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <Equal className="w-4 h-4" />
                                                                                        <span className="font-semibold">Total a pagar:</span>
                                                                                    </div>
                                                                                    <span className="text-lg font-bold">
                                                                                        ${formatCurrency(pago.totalAmount)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            </Accordion>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
            {selectedBillings.length > 0 && (
                <FloatingBilling
                    selectedCount={selectedBillings.length}
                    totalBase={globalTotals.totalBase}
                    totalDiscounts={globalTotals.totalDiscounts}
                    totalFees={globalTotals.totalFees}
                    totalSelected={globalTotals.totalSelected}
                    onRealizarPagos={handleRealizarPagos}
                    onClear={onClear}
                />
            )}
        </>
    )
}