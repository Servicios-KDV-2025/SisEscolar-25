"use client"
import { useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/shadcn/accordion"
import { Checkbox } from "@repo/ui/components/shadcn/checkbox"
import { FloatingBilling } from "./FloatingBilling"
import { Estudiante, EstadoConfig, EstadoBillingConfig, BillingStatusConfig } from "@/types/billing"
import { School, Equal, Plus, Minus, GraduationCap, Calendar, CreditCard, DollarSign, CheckCircle, AlertTriangle } from "@repo/ui/icons"


interface BillingAccordionProps {
    filteredEstudiantes: Estudiante[]
    selectedBillings: string[]
    handleBillingSelection: (paymentId: string, checked: boolean) => void
    handleRealizarPagos: () => void
    onClear: () => void
    getEstadoConfig: (estado: string) => EstadoConfig
    getEstadoBillingConfig: (estado: string) => EstadoBillingConfig
    getBillingStatusConfig: (estado: string) => BillingStatusConfig | undefined
}

export function BillingAccordion({
    filteredEstudiantes,
    selectedBillings,
    handleBillingSelection,
    handleRealizarPagos,
    onClear,
    getEstadoConfig,
    getEstadoBillingConfig,
    getBillingStatusConfig,
}: BillingAccordionProps) {
    const estudianteCalculations = useMemo(() =>
        filteredEstudiantes.map((estudiante) => {
            const studentBillings = estudiante.pagos
            const config = getEstadoConfig(estudiante.estado)
            const Icon = config.icon
            const hasSelectedBillings = studentBillings.some((pago) => selectedBillings.includes(pago.id))

            const selectedBillingsData = studentBillings.filter((p) => selectedBillings.includes(p.id))
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
            estudiante.pagos.filter(pago => selectedBillings.includes(pago.id))
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
                {estudianteCalculations.map(({ estudiante, config, Icon, hasSelectedBillings }) => {

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
                                className={`px-4 sm:px-6 py-4 hover:no-underline rounded-xl transition-colors cursor-pointer ${hasSelectedBillings
                                    ? "hover:bg-blue-100/70"
                                    : estudiante.estado === "retrasado"
                                        ? "hover:bg-red-100/50"
                                        : estudiante.estado === "moroso"
                                            ? "hover:bg-yellow-100/50"
                                            : "hover:bg-gray-50/50"
                                    }`}
                            >
                                <div
                                    className={`w-1 h-16 lg:h-20 ${config.accentColor} ${config.hoverAccentColor} rounded-full flex-shrink-0 transition-colors duration-300`}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-1">
                                        <div className="flex flex-col">
                                            <div className="flex min-w-0 flex-col sm:flex-row sm:gap-1">
                                                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2 truncate" title={estudiante.nombre}>
                                                    {estudiante.nombre}
                                                </h3>
                                                <div className="flex items-center gap-2 sm:ml-3 mb-3 mt-1">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {config.label}
                                                    </span>
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
                                                        {estudiante.pagos.length} cobro{estudiante.pagos.length > 1 ? "s" : ""}
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
                                                                Crédito disponible: ${estudiante.credit.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 text-left md:text-right">
                                            <div className="text-sm text-gray-500 mb-1">Monto Total</div>
                                            <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                                ${estudiante.montoColegiatura.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium">MXN</div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-5 lg:px-6 pb-6">
                                <div className="border-t border-gray-100 pt-5">
                                    <div className="mb-5">
                                        <h3 className="text-base font-semibold text-gray-900 mb-1">Detalle de Cobros</h3>
                                        <p className="text-sm text-gray-500">Selecciona los pagos que deseas procesar</p>
                                    </div>
                                    <div className="space-y-3">
                                        {estudiante.pagos.map((pago) => {
                                            const isBillingSelected = selectedBillings.includes(pago.id)
                                            const isPaid = pago.estado === "Pagado"
                                            const statusConfig = getBillingStatusConfig(pago.estado)
                                            const config = getEstadoBillingConfig(pago.statusBilling)
                                            const StatusIcon = statusConfig?.icon || CheckCircle

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
                                                    <div className="flex flex-col gap-4 p-4 lg:p-5">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                                                                {isPaid === false && (
                                                                    <Checkbox
                                                                        checked={isBillingSelected}
                                                                        onCheckedChange={(checked) => handleBillingSelection(pago.id, checked as boolean)}
                                                                        disabled={isPaid}
                                                                        className={`mt-1 flex-shrink-0 ${isBillingSelected
                                                                            ? "border-blue-500 data-[state=checked]:bg-blue-500"
                                                                            : "border-gray-400"
                                                                            }`}
                                                                    />
                                                                )}

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                                <h5 className="text-base font-semibold text-gray-900">
                                                                                    {pago.tipo.charAt(0).toUpperCase() + pago.tipo.slice(1).toLowerCase()}
                                                                                </h5>
                                                                                <h5 className="text-base font-semibold text-gray-900">
                                                                                    {new Date(pago.startDate).toLocaleDateString('es-MX', { month: 'long' }).charAt(0).toUpperCase()}{new Date(pago.startDate).toLocaleDateString('es-MX', { month: 'long' }).slice(1).toLowerCase()} {new Date(pago.startDate).toLocaleDateString('es-MX', { day: 'numeric' })} - {new Date(pago.endDate).toLocaleDateString('es-MX', { month: 'long' }).charAt(0).toUpperCase()}{new Date(pago.endDate).toLocaleDateString('es-MX', { month: 'long' }).slice(1).toLowerCase()} {new Date(pago.endDate).toLocaleDateString('es-MX', { day: 'numeric' })}
                                                                                </h5>

                                                                            </div>
                                                                            <div className="flex flex-col sm:flex-row pt-1 text-sm text-gray-600 gap-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                                    <span>
                                                                                        Vencimiento:{" "}
                                                                                        <span className="font-medium text-gray-900">{pago.fechaVencimiento}</span>
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                                                                    <span>
                                                                                        Monto base:{" "}
                                                                                        <span className="font-medium text-gray-900">
                                                                                            ${pago.amount.toLocaleString()} MXN
                                                                                        </span>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-shrink-0 text-left lg:text-right">
                                                                            <div className="text-xs text-gray-500 mb-1">
                                                                                {pago.estado === "Pagado" ? "Pagado" : "Total a pagar"}
                                                                            </div>
                                                                            <div className="text-2xl font-bold text-gray-900">
                                                                                ${pago.totalAmount.toLocaleString()}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">MXN</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                        {config && (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                                                                            >
                                                                                <Icon className="w-3.5 h-3.5" />
                                                                                {config.label}
                                                                            </span>
                                                                        )}
                                                                        {statusConfig && (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                                                            >
                                                                                <StatusIcon className="w-3 h-3" />
                                                                                {pago.estado}
                                                                            </span>
                                                                        )}
                                                                        {pago.diasRetraso > 0 && (
                                                                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold">
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                                {pago.diasRetraso} días de retraso
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {(pago.totalDiscount > 0 || pago.lateFee > 0) && (
                                                                        <Accordion type="single" collapsible className="w-full">
                                                                            <AccordionItem value="calculation" className="border-none">
                                                                                <AccordionTrigger className="py-3 px-4 cursor-pointer  hover:bg-gray rounded-lg transition-colors">
                                                                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                                                        <span>Ver desglose del cálculo</span>
                                                                                    </div>
                                                                                </AccordionTrigger>

                                                                                <AccordionContent className="px-4 pb-4 pt-2">
                                                                                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 space-y-3">
                                                                                        <div className="flex items-center justify-between border-b border-gray-100">
                                                                                            <span className="text-sm font-medium text-gray-600">Monto base</span>
                                                                                            <span className="text-base font-semibold text-gray-900">
                                                                                                ${pago.amount.toLocaleString("es-MX")}
                                                                                            </span>
                                                                                        </div>
                                                                                        {pago.appliedDiscounts?.length > 0 && (
                                                                                            <div className="space-y-2">
                                                                                                {pago.appliedDiscounts.map((discount, idx) => (
                                                                                                    <div
                                                                                                        key={idx}
                                                                                                        className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-md border border-green-100"
                                                                                                    >
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <div className="bg-green-100 p-1 rounded-full">
                                                                                                                <Minus className="w-3.5 h-3.5 text-green-700" />
                                                                                                            </div>
                                                                                                            <span className="font-bold text-sm">
                                                                                                                {discount.type === "scholarship" ? "Beca" : "Descuento"}
                                                                                                                {discount.percentage != null && (
                                                                                                                    <span className="ml-1 text-green-700 font-medium">
                                                                                                                        ({discount.percentage}%)
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <span className="text-sm font-semibold text-green-700">
                                                                                                            -${discount.amount.toLocaleString("es-MX")}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                        {pago.lateFee > 0 && (
                                                                                            <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-md border border-red-100">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="bg-red-100 p-1 rounded-full">
                                                                                                        <Plus className="w-3.5 h-3.5 text-red-700" />
                                                                                                    </div>
                                                                                                    <div className="flex flex-col">
                                                                                                        <div className="font-bold text-sm">Recargo por mora</div>
                                                                                                        <div className="text-xs text-rose-700 font-semibold">
                                                                                                            {pago.diasRetraso} días de retraso
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <span className="text-sm font-semibold text-red-700">
                                                                                                    +${pago.lateFee.toLocaleString("es-MX")}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="pt-3 border-t-2 border-gray-200 mt-3">
                                                                                            <div className="flex items-center justify-between py-2 px-3 rounded-md border border-blue-100">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="bg-gray-100 p-1 rounded-full">
                                                                                                        <Equal className="w-3.5 h-3.5" />
                                                                                                    </div>
                                                                                                    <span className="text-sm font-semibold text-gray-900">Total a pagar</span>
                                                                                                </div>
                                                                                                <span className="text-base font-bold">
                                                                                                    ${pago.totalAmount.toLocaleString("es-MX")}
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
                                                        </div>
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