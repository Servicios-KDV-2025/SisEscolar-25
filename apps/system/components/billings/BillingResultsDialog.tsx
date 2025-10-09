import React, { useState } from 'react';
import { X, CheckCircle2, Users, Calendar, DollarSign, FileText, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/shadcn/dialog';
import { Badge } from '@repo/ui/components/shadcn/badge';
import { Button } from '@repo/ui/components/shadcn/button';
import { ScrollArea } from '@repo/ui/components/shadcn/scroll-area';
import { PAYMENT_TYPES, RECURRENCE_TYPES, SCOPE_TYPES, STATUS_TYPES } from 'lib/billing/constants';
import { ResultData } from '@/types/billingConfig';
import { School } from '@repo/ui/icons';

interface PaymentResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ResultData;
}

export function PaymentResultModal({ isOpen, onClose, data }: PaymentResultModalProps) {
    const getStatusVariant = (status: keyof typeof STATUS_TYPES) => {
        const variants = {
            required: "default",
            optional: "secondary",
            inactive: "destructive"
        } as const;
        return variants[status];
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 text-white">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-4 sm:px-6 py-4 sm:py-5">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="mt-0.5 sm:mt-1 p-2 sm:p-2.5 bg-white/10 rounded-lg backdrop-blur-sm shrink-0">
                                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">
                                        Configuración Aplicada Exitosamente
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-200 text-sm sm:text-base leading-relaxed">
                                        {data.message}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="h-[calc(90vh-180px)] sm:h-[calc(90vh-190px)]">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                                    <Users className="w-4 h-4 text-gray-600 shrink-0" />
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Pagos Generados
                                    </span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {data.createdPayments.length}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    estudiante{data.createdPayments.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                                    <DollarSign className="w-4 h-4 text-gray-600 shrink-0" />
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Monto
                                    </span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    ${data.paymentConfig.amount.toLocaleString('es-MX')}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {RECURRENCE_TYPES[data.paymentConfig.recurrence_type]?.toLowerCase()}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                                    <TrendingUp className="w-4 h-4 text-gray-600 shrink-0" />
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Balance
                                    </span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {data.createdPayments.filter(p => p.balanceUpdated).length}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Balances actualizados
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                                    <Calendar className="w-4 h-4 text-gray-600 shrink-0" />
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Ciclo Escolar
                                    </span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {data.paymentConfig.ciclo}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Ciclo escolar {data.paymentConfig.status}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 shrink-0" />
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    Detalles del Cobro Aplicado
                                </h3>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                                    <div className="p-3 sm:p-4">
                                        <span className="text-xs sm:text-sm text-gray-600">Tipo de Pago</span>
                                        <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                                            {PAYMENT_TYPES[data.paymentConfig.type]}
                                        </p>
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <span className="text-xs sm:text-sm text-gray-600">Recurrencia</span>
                                        <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                                            {RECURRENCE_TYPES[data.paymentConfig.recurrence_type]}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-t border-gray-200">
                                    <div className="p-3 sm:p-4">
                                        <span className="text-xs sm:text-sm text-gray-600">Alcance</span>
                                        <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                                            {SCOPE_TYPES[data.paymentConfig.scope]}
                                        </p>
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <span className="text-xs sm:text-sm text-gray-600">Estado</span>
                                        <div className="mt-1">
                                            <Badge
                                                variant={getStatusVariant(data.paymentConfig.status)}
                                                className="font-semibold text-xs"
                                            >
                                                {STATUS_TYPES[data.paymentConfig.status]}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm text-gray-600">ID de Configuración</span>
                      <p className="text-xs sm:text-sm font-mono text-gray-900 mt-1 break-all">
                        {data.paymentConfig.id}
                      </p>
                    </div>
                  </div>
                </div> */}
                            </div>
                        </div>

                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 shrink-0" />
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        Estudiantes Afectados
                                    </h3>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-600">
                                    {data.createdPayments.length} estudiante(s)
                                </span>
                            </div>

                            <div className="space-y-2 sm:space-y-2.5">
                                {data.createdPayments.map((payment) => (
                                    <div
                                        key={payment.paymentId}
                                        className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                <div className="bg-gray-100 text-gray-700 font-semibold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-md w-fit">
                                                    {payment.enrollment}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 truncate">
                                                        {payment.studentName}
                                                    </h4>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-600">
                                                        <span className="font-mono truncate" title={`Balance: ${payment.balance}`}>
                                                            {payment.balance >= 0 ? (
                                                                <Badge variant="default" className="bg-green-600 text-white mt-2 text-xs whitespace-nowrap">
                                                                    <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                                                                    Balance: {payment.balance}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="bg-red-600 text-white mt-1 hover:bg-gray-100 text-xs whitespace-nowrap">
                                                                    <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                                                                    Balance: {payment.balance}
                                                                </Badge>
                                                            )}
                                                        </span>
                                                        <span className="font-mono truncate" title={`Grupo: ${payment.group}`}>

                                                            <Badge variant="default" className="bg-gray-500 mt-1 text-xs whitespace-nowrap">
                                                                <School className="w-3 h-3 mr-1 shrink-0" />
                                                                Grupo: {payment.group}
                                                            </Badge>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                {payment.balanceUpdated ? (
                                                    <Badge variant="default" className="bg-gray-900 text-xs whitespace-nowrap">
                                                        <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                                                        Balance actualizado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs whitespace-nowrap">
                                                        <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
                    <Button
                        onClick={onClose}
                        className="bg-gray-900 hover:bg-gray-800 w-full sm:w-auto"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
