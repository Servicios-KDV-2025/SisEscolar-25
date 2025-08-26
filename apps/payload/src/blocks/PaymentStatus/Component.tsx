"use client";
import React, { useEffect, useState } from "react";

type Props = {
  status: "success" | "cancelled";
  title: string;
  message: string;
  image?: { url: string; alt?: string };
  button?: { label: string; url: string };
  showPaymentInfo?: boolean;
};

export interface PaymentInfo {
  email: string | null;
  amount: number | null;
  currency: string | null;
  subscriptionId: string | null;
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

  useEffect(() => {
    if (status === "success") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("sessionId");
      console.log(sessionId)

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

  return (
    // ... existing code ...
    <section
      className={`relative overflow-hidden min-h-[80vh] px-6 py-16 text-center ${
        isSuccess 
          ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" 
          : "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50"
      }`}
    >
      {/* Background decoration */}
      <div className={`absolute inset-0 opacity-5 ${
        isSuccess ? "bg-green-500" : "bg-red-500"
      }`} style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23currentColor' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Icon/Image section */}
        {image?.url && (
          <div className="mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
              isSuccess 
                ? "bg-green-100 shadow-lg shadow-green-200/50" 
                : "bg-red-100 shadow-lg shadow-red-200/50"
            } mb-6`}>
              <img
                src={image.url}
                alt={image.alt || ""}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
        )}

        {/* Success/Error icon fallback */}
        {!image?.url && (
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
            isSuccess 
              ? "bg-green-100 shadow-lg shadow-green-200/50" 
              : "bg-red-100 shadow-lg shadow-red-200/50"
          } mb-6`}>
            <div className={`text-4xl ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}>
              {isSuccess ? "✓" : "✕"}
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
          isSuccess ? "text-green-800" : "text-red-800"
        }`}>
          {title}
        </h1>

        {/* Message */}
        <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-8 ${
          isSuccess ? "text-green-700" : "text-red-700"
        }`}>
          {message}
        </p>

        {/* Payment Info Card */}
        {paymentInfo && (
          <div className={`bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-8 mb-8 max-w-md mx-auto ${
            isSuccess 
              ? "shadow-green-200/50" 
              : "shadow-red-200/50"
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isSuccess ? "text-green-800" : "text-red-800"
            }`}>
              Detalles del Pago
            </h3>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-800 font-semibold">{paymentInfo.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Monto:</span>
                <span className="text-gray-800 font-semibold">
                  {((paymentInfo.amount ?? 0) / 100).toFixed(2)} {paymentInfo.currency?.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">ID Suscripción:</span>
                <span className="text-gray-800 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                  {paymentInfo.subscriptionId}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {button?.url && (
          <div className="mt-8">
            <a
              href={button.url}
              className={`inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${
                isSuccess
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/25"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-500/25"
              }`}
            >
              {button.label}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
// ... existing code ...
  );
};
