import { Id } from "../_generated/dataModel";

/**
* Template mejorado para correo electrónico de confirmación de pago
*
* Mejoras implementadas:
* - Diseño más moderno y limpio con mejor jerarquía visual
* - Mejor organización de la información con tarjetas más compactas
* - Iconos SVG inline para mejor compatibilidad
* - Tabla de desglose simplificada y más clara
* - Mejor contraste y legibilidad de colores
* - Estructura de código más limpia y mantenible
* - Responsive mejorado con mejor soporte móvil
* - Eliminación de código redundante
*/

interface PaymentDiscount {
  reason: string;
  amount: number;
  type: "scholarship" | "rule";
  ruleId?: Id<"billingRule">;
  percentage?: number;
}

interface PaymentStudent {
  name: string;
  lastName?: string;
  enrollment: string;
}

interface PaymentData {
  id: string;
  amount: number;
  baseAmount: number;
  method: string;
  createdAt: number;
  totalAmount: number;
  totalDiscount?: number;
  appliedDiscounts?: PaymentDiscount[];
  lateFee?: number;
  daysLate?: number;
  billingConfig?: {
    type: string;
  };
  student?: PaymentStudent;
}

interface SchoolData {
  name: string;
  subdomain: string;
  email: string;
  address: string;
  phone: string;
  imgUrl: string;
}

interface UserData {
  name: string;
  email: string;
}

type PaymentType = "colegiatura" | "seguro" | "alimentación" | "inscripción" | "examen" | "material" | "otro";

interface TemplateParams {
  school: SchoolData;
  user: UserData;
  payment: PaymentData;
  serverUrl: string;
  paymentType: PaymentType;
  invoiceUrl?: string;
}

export function schoolPaymentSuccessTemplate({
  school,
  user,
  payment,
  serverUrl,
  paymentType,
  invoiceUrl,
}: TemplateParams): string {

  // Sanitización mejorada con manejo de null/undefined
  const sanitize = (str: string | undefined | null): string => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
      }; return map[char] || char;
    });
  }; // Formateo de
  const formatPaymentMethod = (method: string): string => {
    const methodMap: Record<string, string> = {
      cash: "Efectivo",
      card: "Tarjeta",
      bank_transfer: "Transferencia",
      customer_balance: "Transferencia",
      oxxo: "OXXO",
      other: "Otro método",
    };
    return methodMap[method] || sanitize(method);
  };

  // Contenido personalizado según tipo de pago
  const getPaymentContent = () => {
    const contents: Record<PaymentType, { title: string; message: string; concept: string; period: string }> = {
      colegiatura: {
        title: "Confirmación de Pago de Colegiatura",
        message: "Tu pago de colegiatura ha sido procesado exitosamente. Gracias por tu compromiso con la educación.",
        concept: "Colegiatura",
        period: "Enero 2025",
      },
      seguro: {
        title: "Confirmación de Pago de Seguro",
        message: "El pago del seguro escolar ha sido procesado. Tu estudiante cuenta con cobertura actualizada.",
        concept: "Seguro escolar",
        period: "Ciclo 2024-2025",
      },
      alimentación: {
        title: "Confirmación de Pago de Alimentación",
        message: "El pago del servicio de alimentación ha sido confirmado exitosamente.",
        concept: "Servicio de alimentación",
        period: "Enero 2025",
      },
      inscripción: {
        title: "Confirmación de Pago de Inscripción",
        message: "Tu pago de inscripción ha sido procesado exitosamente.",
        concept: "Inscripción",
        period: "Ciclo escolar",
      },
      examen: {
        title: "Confirmación de Pago de Examen",
        message: "El pago del examen ha sido confirmado exitosamente.",
        concept: "Examen",
        period: "Período de exámenes",
      },
      material: {
        title: "Confirmación de Pago de Material Escolar",
        message: "El pago del material escolar ha sido procesado exitosamente.",
        concept: "Material escolar",
        period: "Inicio de ciclo",
      },
      otro: {
        title: "Confirmación de Pago",
        message: "Tu pago ha sido procesado exitosamente. Gracias por tu preferencia.",
        concept: payment.billingConfig?.type || "Pago general",
        period: "Período actual",
      },
    };
    return contents[paymentType];
  };

  const content = getPaymentContent();
  const transactionId = `TXN-${Date.now().toString().slice(-8)}-${payment.id.slice(-4).toUpperCase()}`;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const paymentDate = new Date(payment.createdAt).toLocaleDateString('es-ES', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
            <!DOCTYPE html>
            <html lang="es">

            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <title>${sanitize(content.title)}</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  margin: 0;
                  padding: 20px 0;
                  color: #1a202c;
                  line-height: 1.6;
                }

                .container {
                  max-width: 650px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 16px;
                  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                  overflow: hidden;
                  position: relative;
                  border: 1px solid #e2e8f0;
                }

                /* Header styles removed - using inline styles for better email compatibility */

                .amount-section {
                  padding: 32px;
                  text-align: center;
                  border-bottom: 1px solid #e5e7eb;
                }

                .amount-label {
                  font-size: 12px;
                  font-weight: 600;
                  color: #6b7280;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  margin-bottom: 8px;
                }

                .amount {
                  padding: 0px;
                  font-size: 44px;
                  font-weight: 800;
                  color: #333333;
                  margin-bottom: 12px;
                }

                .date {
                  font-size: 14px;
                  color: #6b7280;
                }

                .content {
                  padding: 32px;
                }

                .greeting {
                  font-size: 18px;
                  font-weight: 600;
                  color: #111827;
                  margin-bottom: 16px;
                }

                .message {
                  font-size: 15px;
                  color: #4b5563;
                  line-height: 1.7;
                  margin-bottom: 24px;
                }

                .card {
                  background-color: #f9fafb;
                  border: 1px solid #e5e7eb;
                  border-radius: 12px;
                  padding: 20px;
                  margin-bottom: 24px;
                }

                .card-title {
                  font-size: 12px;
                  font-weight: 600;
                  color: #000;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 16px;
                }

                .info-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  width: 100%;
                }

                .info-row:hover {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  width: 100%;
                  background-color: rgba(30, 64, 175, 0.02);
                  border-radius: 8px;
                  margin: 0 -8px 16px -8px;
                  padding: 12px 8px;
                }

                .info-row:last-child {
                  border-bottom: none;
                }

                .info-label {
                  font-size: 13px;
                  color: #000;
                }

                .info-value {
                  font-size: 14px;
                  font-weight: 600;
                  color: #111827;
                }

                .status-badge {
                  display: inline-block;
                  background-color: #d1fae5;
                  color: #065f46;
                  font-size: 12px;
                  font-weight: 600;
                  padding: 4px 12px;
                  border-radius: 20px;
                }

                .breakdown-table {
                  width: 100%;
                  border: 1px;
                  margin-bottom: 24px;
                }

                .breakdown-table th {
                  background-color: #f3f4f6;
                  padding: 12px;
                  text-align: left;
                  font-size: 12px;
                  font-weight: 600;
                  color: #000;
                  text-transform: uppercase;
                }

                .breakdown-table td {
                  padding: 12px;
                  font-size: 14px;
                }

                .breakdown-table tr:last-child td {
                  border-bottom: none;
                }

                .discount {
                  color: #059669;
                }

                .late-fee {
                  color: #dc2626;
                }

                .total-row {
                  background-color: #f9fafb;
                  font-weight: 700;
                }

                .buttons {
                  text-align: center;
                  padding: 32px;
                  background-color: #f9fafb;
                }

                .button {
                  display: inline-block;
                  background-color: #333333;
                  color: #fff !important;
                  padding: 14px 28px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 14px;
                  font-weight: 600;
                  margin: 0 8px 12px;
                  transition: background-color 0.2s;
                }

                .button:hover {
                  background-color: #555555;
                  color: #fff;
                }

                .button-secondary {
                  background-color: #ffffff;
                  color: #475569 !important;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
                }

                .button-secondary:hover {
                  background-color: #1f2937;
                  color: #fff !important;
                  border-radius: 8px;
                  border: 0px;
                }

                .help-section {
                  background-color: #f9fafb;
                  padding: 24px;
                  text-align: center;
                  border-top: 1px solid #e5e7eb;
                }

                .help-title {
                  font-size: 14px;
                  font-weight: 600;
                  color: #374151;
                  margin-bottom: 8px;
                }

                .help-text {
                  font-size: 13px;
                  color: #6b7280;
                }

                .help-link {
                  color: #333333;
                  text-decoration: none;
                  font-weight: 600;
                }

                .footer {
                  padding: 0px 0px 32px;
                  text-align: center;
                  color: #6b7280;
                  font-size: 12px;
                  align-items: center;
                }

                .footer-logo {
                  margin-bottom: 16px;
                }

                .footer-text {
                  margin: 8px 0;
                }

                .success-icon {
                  font-size: 60px;
                  margin-bottom: 10px;
                  display: block;
                  position: relative;
                  z-index: 1;
                  color: #059669;
                  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                }

                .school-header {
                  padding: 10px 20px;
                  background-color: #ffffff;
                  border-bottom: 1px solid #eaeaea;
                  width: 100%;
                  box-sizing: border-box;
                }

                .school-header-inner {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  width: 100%;
                  box-sizing: border-box;
                }

                .school-header-content {
                  display: flex;
                  flex-direction: column;
                }

                .school-name {
                  margin: 0;
                  font-size: 20px;
                  font-weight: 600;
                  color: #212529;
                  letter-spacing: -0.5px;
                  line-height: 1.3;
                  display: block;
                }

                .school-tagline {
                  margin-top: 4px;
                  font-size: 12px;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  display: block;
                }

                .school-logo {
                  max-width: 60px;
                  height: auto;
                  display: block;
                }

                @media only screen and (max-width: 600px) {
                  .container {
                    max-width: 100% !important;
                  }

                  /* Header más compacto en móvil */
                  .header-mobile {
                    padding: 24px 20px !important;
                  }

                  .header-mobile h1 {
                    font-size: 24px !important;
                  }

                  .header-mobile .success-icon {
                    margin-bottom: 16px !important;
                  }

                  .header-mobile .success-icon div {
                    width: 60px !important;
                    height: 60px !important;
                  }

                  .header-mobile .success-icon span {
                    font-size: 30px !important;
                  }

                  /* Logos más pequeños en móvil */
                  .logo-mobile {
                    max-width: 50px !important;
                    height: auto !important;
                  }

                  .footer-logo-mobile {
                    max-width: 50px !important;
                    height: auto !important;
                  }

                  /* Header principal más pequeño */
                  .school-header-mobile {
                    padding: 5px 20px !important;
                  }

                  .school-name-mobile {
                    font-size: 18px !important;
                  }

                  .school-tagline-mobile {
                    font-size: 11px !important;
                  }

                  .amount-section {
                    padding: 24px 20px;
                  }

                  .amount {
                    font-size: 36px;
                  }

                  .content {
                    padding: 24px 20px;
                  }

                  .card {
                    padding: 16px;
                  }

                  .buttons {
                    padding: 24px 20px;
                  }

                  .button {
                    display: block;
                    margin: 0 0 12px;
                    width: 100% !important;
                    box-sizing: border-box !important;
                  }

                  .breakdown-table {
                    font-size: 13px;
                  }

                  .breakdown-table th,
                  .breakdown-table td {
                    padding: 8px;
                  }
                }
              </style>
            </head>

            <body>
              <div class="container">
                <div class="school-header">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle" style="padding: 0 15px  0;">
                        <div
                          style="font-size: 20px; font-weight: 600; color: #212529; letter-spacing: -0.5px; line-height: 1.3; margin: 0;">
                          ${sanitize(school.name)}
                        </div>
                        <div
                          style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                          Plataforma Educativa
                        </div>
                      </td>
                      ${school.imgUrl ? `
                      <td valign="middle" align="right" style="padding: 0 0 0 10px;">
                        <img src="${sanitize(school.imgUrl)}" alt="Logo de ${sanitize(school.name)}"
                          style="max-width: 60px; height: auto; display: block;">
                      </td>
                      ` : ""}
                    </tr>
                  </table>
                </div>

                <!-- Header con éxito -->
                <div class="header-mobile"
                  style="padding: 15px 32px 45px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                  <span class="success-icon" style="color: #059669;">✓</span>
                  <h1
                    style="color: #059669; font-size: 32px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: -0.5px; line-height: 1.2;">
                    ¡Pago Confirmado!</h1>
                  <p style="color: #10b981; font-size: 18px; margin: 0; font-weight: 500;">Tu transacción ha sido
                    procesada exitosamente</p>
                </div>

                <!-- Sección de monto -->
                <div class="amount-section">
                  <div class="amount-label">Monto Pagado</div>
                  <div class="amount">${formatCurrency(payment.amount)}</div>
                  <div class="date">${sanitize(paymentDate)}</div>
                </div>

                <!-- Contenido principal -->
                <div class="content">
                  <div class="greeting">Estimado/a ${sanitize(user.name)},</div>
                  <div class="message">${sanitize(content.message)}</div>

                  ${payment.student ? `
                  <!-- Información del estudiante -->
                  <div class="card">
                    <div class="card-title">Información del Estudiante</div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          Nombre</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          ${sanitize(payment.student.name)} ${sanitize(payment.student.lastName || '')}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          Matrícula</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          ${sanitize(payment.student.enrollment)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0;">Concepto</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0;">
                          ${sanitize(content.concept)}</td>
                      </tr>
                    </table>
                  </div>
                  ` : ''}

                  <!-- Detalles de transacción -->
                  <div class="card">
                    <div class="card-title">Detalles de la Transacción</div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">No.
                          de Transacción</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-family: 'Courier New', monospace;">
                          ${sanitize(transactionId)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          Método de Pago</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          ${formatPaymentMethod(payment.method)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0;">Estado</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0;">
                          <span class="status-badge">✓ Completado</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Desglose del pago -->
                  <div class="card">
                    <div class="card-title">Desglose del Pago</div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong>${sanitize(content.concept)}</strong><br>
                          <span style="font-size: 12px; color: #6b7280;">Período: ${sanitize(content.period)}</span>
                        </td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #111827; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          ${formatCurrency(payment.baseAmount)}</td>
                      </tr>

                      ${payment.appliedDiscounts?.map(discount => `
                      <tr>
                        <td style="font-size: 13px; color: #059669; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          ↓ ${discount.type === "scholarship" ? "Beca" : "Descuento"}
                          ${discount.percentage ? ` (${discount.percentage}%)` : ''}
                        </td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #059669; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          -${formatCurrency(discount.amount)}</td>
                      </tr>
                      `).join('') || ''}

                      ${payment.lateFee ? `
                      <tr>
                        <td style="font-size: 13px; color: #dc2626; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          ↑ Recargo por ${payment.daysLate || 0} día${(payment.daysLate || 0) !== 1 ? 's' : ''} de
                          atraso
                        </td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #dc2626; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          +${formatCurrency(payment.lateFee)}</td>
                      </tr>
                      ` : ''}

                      <tr>
                        <td style="font-size: 13px; color: #059669; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">↓
                          Pago realizado</td>
                        <td
                          style="font-size: 14px; font-weight: 600; color: #059669; text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          -${formatCurrency(payment.amount)}</td>
                      </tr>

                      <tr>
                        <td style="font-size: 13px; color: #000; padding: 8px 0; font-weight: 700;">Saldo restante</td>
                        <td
                          style="font-size: 14px; font-weight: 700; color: #111827; text-align: right; padding: 8px 0;">
                          ${formatCurrency(payment.totalAmount)}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Botones de acción -->
                  <div class="buttons">
                    ${invoiceUrl ? `<a href="${sanitize(invoiceUrl)}" class="button" target="_blank">Ver Recibo</a>` : ''}
                    <a href="${serverUrl}" class="button button-secondary">Ir al Portal</a>
                  </div>

                  <!-- Sección de ayuda -->
                  <div class="help-section">
                    <div class="help-title">¿Necesitas ayuda?</div>
                    <div class="help-text">
                      Contáctanos en <a href="mailto:${sanitize(school.email)}"
                        class="help-link">${sanitize(school.email)}</a> o llámanos al ${sanitize(school.phone)}
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                  ${school.imgUrl ? `
                  <div style="text-align: center; margin-bottom: 16px; align-items: center;">
                    <div style="width: 80px; height: 80px; display: inline-block; vertical-align: middle; text-align: center; background-color: #fff; align-items: center;">
                      <img src="${sanitize(school.imgUrl)}" alt="Logo de ${sanitize(school.name)}"
                        style="max-width: 70px; max-height: 70px; width: auto; height: auto; display: block; margin: 0 auto; padding: 5px;">
                    </div>
                  </div>
                  ` : ""}
                  <div class="footer-text"><strong>${sanitize(school.name)}</strong></div>
                  <div class="footer-text">${sanitize(school.address)}</div>
                  <div class="footer-text">
                    <a href="https://${sanitize(school.subdomain)}.ekardex.app"
                      class="help-link">${sanitize(school.subdomain)}.ekardex.app</a>
                  </div>
                  <div class="footer-text" style="margin-top: 16px; color: #9ca3af;">
                    Este correo es una confirmación automática de tu pago.<br>
                    Consérvalo como comprobante de tu transacción.<br>
                    © ${new Date().getFullYear()} ${sanitize(school.name)}. Todos los derechos reservados.
                  </div>
                </div>

              </div>
            </body>

            </html>`;
}