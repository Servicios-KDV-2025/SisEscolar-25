export function paymentSuccessTemplate({
    school,
    user,
    invoice,
    currentDate,
    serverUrl
}: {
    school: { name: string; subdomain: string; email: string };
    user: { name: string; email: string };
    invoice: any;
    currentDate: string;
    serverUrl: string;
}) {
    return `
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido a ${school.name}! - Pago Confirmado</title>
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

        .header {
            background: #fff;
            color: #ffffff;
            padding: 60px 40px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="80" cy="40" r="1" fill="%23ffffff" opacity="0.03"/><circle cx="40" cy="80" r="1" fill="%23ffffff" opacity="0.06"/><circle cx="70" cy="10" r="1" fill="%23ffffff" opacity="0.04"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            pointer-events: none;
        }

        .success-icon {
            font-size: 72px;
            margin-bottom: 20px;
            display: block;
            position: relative;
            z-index: 1;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }

        .header h1 {
            margin: 0;
            font-size: 2.8rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
            color: #000;
        }

        .header .subtitle {
            margin: 16px 0 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 400;
            position: relative;
            z-index: 1;
            color: #000;
        }

        .content {
            padding: 50px 40px;
        }

        .welcome-section {
            text-align: center;
            margin-bottom: 45px;
        }

        .welcome-section h2 {
            color: #1a202c;
            font-size: 1.8rem;
            margin-bottom: 20px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }

        .welcome-section p {
            color: #4a5568;
            font-size: 1rem;
            margin: 0 0 12px 0;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.7;
        }

        .payment-details {
            border-radius: 12px;
            padding: 35px 30px;
            margin: 40px 0;
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
        }

        .payment-details::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #1e40af 0%, #1e3a8a 100%);
        }

        .payment-details h3 {
            color: #1a202c;
            margin: 0 0 25px 0;
            font-size: 1.3rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s ease;
        }

        .detail-row:hover {
            background-color: rgba(30, 64, 175, 0.02);
            border-radius: 8px;
            margin: 0 -8px 16px -8px;
            padding: 12px 8px;
        }

        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .detail-label {
            font-weight: 500;
            color: #64748b;
            font-size: 1rem;
            flex-shrink: 0;
            margin-right: 20px;
        }

        .detail-value {
            color: #1a202c;
            font-weight: 600;
            font-size: 1rem;
            text-align: right;
            word-break: break-word;
            flex: 1;
        }

        .detail-value a {
            color: #1e40af;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .detail-value a:hover {
            color: #1e3a8a;
            text-decoration: underline;
        }

        .status-active {
            color: #059669 !important;
            font-weight: 700 !important;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
        }

        .cta-section {
            text-align: center;
            margin: 50px 0 0 0;
            padding: 35px 30px;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #d1fae5;
        }

        .cta-section h3 {
            color: #1a202c;
            font-weight: 600;
            font-size: 1.5rem;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .cta-section p {
            color: #4a5568;
            font-size: 1.1rem;
            margin-bottom: 25px;
            max-width: 450px;
            margin-left: auto;
            margin-right: auto;
        }

        .cta-button {
            display: inline-block;
            background: #fff;
            color: #000 !important;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1rem;
            letter-spacing: 0.3px;
            box-shadow: 0 6px 20px rgba(30, 64, 175, 0.25);
            transition: all 0.3s ease;
            border: none;
            position: relative;
            overflow: hidden;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.35);
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.5s ease;
        }

        .cta-button:hover::before {
            left: 100%;
        }

        .next-steps {
            background: #ffffff;
            border-radius: 12px;
            padding: 30px;
            margin: 40px 0 0 0;
            border-left: 4px solid #dc2626;
            border: 1px solid #fee2e2;
        }

        .next-steps h4 {
            color: #000;
            margin: 0 0 18px 0;
            font-size: 1.2rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .next-steps ul {
            margin: 0;
            padding-left: 0;
            list-style: none;
            color: #4a5568;
            font-size: 1rem;
        }

        .next-steps li {
            padding: 8px 0 8px 30px;
            position: relative;
            transition: color 0.2s ease;
        }

        .next-steps li:hover {
            color: #1a202c;
        }

        .next-steps li::before {
            content: '✨';
            position: absolute;
            left: 0;
            top: 8px;
            font-size: 16px;
        }

        .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #1a202c;
            text-align: center;
            padding: 40px 30px;
            font-size: 0.95rem;
            border-top: 3px solid #1e40af;
        }

        .footer a {
            color: #1e40af;
            text-decoration: none;
            transition: color 0.2s ease;
            font-weight: 500;
        }

        .footer a:hover {
            color: #1e3a8a;
            text-decoration: underline;
        }

        .footer p {
            margin: 10px 0;
            color: #4a5568;
        }

        .footer-logo {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1a202c;
        }

        @media (max-width: 700px) {
            body {
                padding: 10px 0;
            }

            .container {
                margin: 0 10px;
                border-radius: 12px;
            }

            .header,
            .content,
            .payment-details,
            .next-steps,
            .cta-section,
            .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }

            .header {
                padding-top: 40px !important;
                padding-bottom: 30px !important;
            }

            .header h1 {
                font-size: 2.2rem !important;
            }

            .success-icon {
                font-size: 60px !important;
            }

            .detail-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }

            .detail-value {
                text-align: left;
            }

            .cta-section h3 {
                font-size: 1.3rem;
            }

            .cta-button {
                padding: 16px 32px;
                font-size: 1rem;
            }
        }

        @media (max-width: 480px) {
            .container {
                margin: 0 5px;
            }

            .header h1 {
                font-size: 1.9rem !important;
            }

            .welcome-section h2 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <span class="success-icon">🎉</span>
            <h1>¡Pago Confirmado!</h1>
            <p class="subtitle">Tu suscripción ha sido activada exitosamente</p>
        </div>
        <div style="height: 1px; background-color: #f8f8f8; width: 100%;"></div>

        <div class="content">
            <div class="welcome-section">
                <h2>¡Bienvenido a ${school.name}! 🏫</h2>
                <p>Hola <strong>${user.name}</strong>,</p>
                <p>Nos complace enormemente confirmar que tu pago ha sido procesado exitosamente y tu suscripción está
                    ahora completamente activa.</p>
            </div>

            <div class="payment-details">
                <h3>📋 Detalles de tu Suscripción</h3>
                <div class="detail-row">
                    <span class="detail-label">🏫 Escuela:</span>
                    <span class="detail-value">${school.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🌐 Plataforma:</span>
                    <span class="detail-value">
                        <a href="https://${school.subdomain}.${serverUrl}">
                            ${school.subdomain}.${serverUrl}
                        </a></span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Usuario:</span>
                    <span class="detail-value">${user.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📦 Plan:</span>
                    <span class="detail-value">${invoice.lines?.data?.[0]?.description || 'Plan Premium'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Inicio:</span>
                    <span class="detail-value">${invoice.lines?.data?.[0]?.period?.start ? new
            Date(invoice.lines.data[0].period.start * 1000).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', day: 'numeric'
            }) : 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Renovación:</span>
                    <span class="detail-value">${invoice.lines?.data?.[0]?.period?.end ? new
            Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', day: 'numeric'
            }) : 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🟢 Estado:</span>
                    <span class="detail-value status-active">✅ Activo</span>
                </div>
            </div>

            <div class="cta-section">
                <h3>🚀 ¡Es hora de comenzar!</h3>
                <p>Tu plataforma educativa está lista. Accede ahora a todas las herramientas y funcionalidades que <strong>${school.name}</strong> tiene preparadas para ti.</p>
                <a href="https://${school.subdomain}.${process.env.NEXT_EMAIL_SERVER_URL}" class="cta-button">
                    Acceder a mi Plataforma
                </a>
            </div>

            <div class="next-steps">
                <h4>💡 Primeros pasos recomendados:</h4>
                <ul>
                    <li>Completa la configuración de tu perfil personal</li>
                    <li>Explora el panel de control y sus funcionalidades</li>
                    <li>Revisa la documentación y tutoriales disponibles</li>
                    <li>Configura las preferencias de tu institución</li>
                    <li>Invita a tu equipo y estudiantes a unirse</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <div class="footer-logo">${school.name}</div>
            <p>© ${new Date().getFullYear()} ${school.name}. Todos los derechos reservados.</p>
            <p>¿Necesitas ayuda? <a href="mailto:${school.email}">Contáctanos aquí</a> - Estamos para apoyarte</p>
            <p style="margin-top: 20px; font-size: 13px; opacity: 0.7; color: #64748b;">
                Este correo fue enviado automáticamente el ${currentDate}.<br>
                Por favor, no respondas directamente a esta dirección.
            </p>
        </div>
    </div>
</body>

</html>`;
}