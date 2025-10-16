"use client";
import React, { useEffect, useState } from "react";
import { useHideHeader } from "@/hooks/useHideHeader";
 
type Props = {
  status: "success" | "cancelled";
  title: string;
  message: string;
  image?: { url: string; alt?: string };
  button?: { label: string; url: string };
  showPaymentInfo?: boolean;
};
 
export interface PaymentInfo {
  email?: string
  amount?: number
  currency?: string
  subscriptionId?: string
  subscription_current_period_start?: number
  subscription_current_period_end?: number
}
 
export const PaymentStatusBlock: React.FC<Props> = ({
  status,
  title,
  message,
  image,
  button,
  showPaymentInfo,
}) => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [currentDate] = useState(new Date());
 
  // Ocultar el header en las páginas de estado de pago
  useHideHeader(true);
 
  useEffect(() => {
    if (status === "success") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("sessionId");
 
      if (sessionId) {
        fetch('/api/payment-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
          .then(res => res.json())
          .then(data => setPaymentInfo(data))
          .then(data => console.log(data))
          .catch(console.error);
      }
    }
  }, [status, showPaymentInfo]);
 
  const isSuccess = status === "success";
 
  const handleInvoiceRequest = () => {
    // Aquí puedes implementar la lógica para solicitar factura
    alert('Solicitud de factura enviada. Te contactaremos pronto.');
  };
 
  return (
    <section
      className={`relative overflow-hidden min-h-screen px-6 py-16 ${
        isSuccess
          ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
          : "bg-gradient-to-br from-rose-50 via-pink-50 to-red-50"
      }`}
    >
      {/* Background decoration */}
      <div className={`absolute inset-0 opacity-5 ${
        isSuccess ? "bg-emerald-500" : "bg-rose-500"
      }`} style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23currentColor' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
 
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Icon/Image section */}
          {image?.url && (
            <div className="mb-8">
              <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full ${
                isSuccess
                  ? "bg-emerald-100 shadow-2xl shadow-emerald-200/50"
                  : "bg-rose-100 shadow-2xl shadow-rose-200/50"
              } mb-6 transform hover:scale-110 transition-transform duration-300`}>
                <img
                  src={image.url}
                  alt={image.alt || ""}
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
          )}
 
          {/* Success/Error icon fallback */}
          {!image?.url && (
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full ${
              isSuccess
                ? "bg-emerald-100 shadow-2xl shadow-emerald-200/50"
                : "bg-rose-100 shadow-2xl shadow-rose-200/50"
            } mb-6 transform hover:scale-110 transition-transform duration-300`}>
              <div className={`text-5xl ${
                isSuccess ? "text-emerald-600" : "text-rose-600"
              }`}>
                {isSuccess ? "✓" : "✕"}
              </div>
            </div>
          )}
 
          {/* Title */}
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${
            isSuccess ? "text-emerald-800" : "text-rose-800"
          }`}>
            {title}
          </h1>
 
          {/* Message */}
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-8 ${
            isSuccess ? "text-emerald-700" : "text-rose-700"
          }`}>
            {message}
          </p>
        </div>
 
        {/* Success Content */}
        {isSuccess && paymentInfo && (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Payment Details Card */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Detalles del Pago</h3>
              </div>
             
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-gray-800 font-semibold">{paymentInfo.email}</span>
                </div>
               
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Monto:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {((paymentInfo.amount ?? 0) / 100).toFixed(2)} {paymentInfo.currency?.toUpperCase()}
                  </span>
                </div>
               
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">ID Suscripción:</span>
                  <span className="text-gray-800 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
                    {paymentInfo.subscriptionId}
                  </span>
                </div>
              </div>
            </div>
 
            {/* Account Details Card */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Información de la Cuenta</h3>
              </div>
             
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Fecha de Activación:</span>
                  <span className="text-gray-800 font-semibold">${paymentInfo.subscription_current_period_start ? new
            Date(paymentInfo.subscription_current_period_start * 1000).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', day: 'numeric'
            }) : 'N/A'}</span>
                </div>
               
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Fecha de Expiración:</span>
                  <span className="text-gray-800 font-semibold">${paymentInfo.subscription_current_period_end ? new
            Date(paymentInfo.subscription_current_period_end * 1000).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', day: 'numeric'
            }) : 'N/A'}</span>
                </div>
               
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">Estado:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                    Activa
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* Success Actions */}
        {isSuccess && (
          <div className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Próximos Pasos</h3>
           
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 bg-emerald-50 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Correo de Confirmación</h4>
                <p className="text-gray-600">Hemos enviado un correo de confirmación a tu email con todos los detalles de tu compra.</p>
              </div>
             
              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Acceso a la Plataforma</h4>
                <p className="text-gray-600">Tu cuenta ya está activa. Accede a la plataforma escolar con tus credenciales.</p>
              </div>
            </div>
 
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {button?.url && (
                <a
                  href={button.url}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  {button.label}
                </a>
              )}
             
              <button
                onClick={handleInvoiceRequest}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Solicitar Factura
              </button>
            </div>
          </div>
        )}
 
        {/* Cancelled Payment Content */}
        {!isSuccess && (
          <div className="bg-white/90 backdrop-blur-sm border border-white/30 shadow-2xl rounded-3xl p-8 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
             
              <h3 className="text-2xl font-bold text-gray-800 mb-4">¿Necesitas ayuda?</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Si tienes alguna pregunta sobre el proceso de pago o necesitas asistencia,
                nuestro equipo de soporte está aquí para ayudarte.
              </p>
             
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contactar Soporte
                </a>
               
                <a
                  href="/"
                  className="inline-flex items-center px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Volver al Inicio
                </a>
              </div>
            </div>
          </div>
        )}
 
        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Si tienes alguna pregunta, no dudes en contactarnos
          </p>
        </div>
      </div>
    </section>
  );
};