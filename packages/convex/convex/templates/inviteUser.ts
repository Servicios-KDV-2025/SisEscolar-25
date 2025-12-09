export const inviteUserTemplate = ({
  name,
  inviteUrl,
}: {
  name: string;
  inviteUrl: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Hola ${name},</h2>
    <p>Has sido invitado a unirte a nuestra plataforma.</p>
    <p>Para comenzar, por favor acepta la invitación haciendo clic en el siguiente botón:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
    </p>
    <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>Este enlace expirará en 30 días.</p>
    <div class="footer">
      <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
    </div>
  </div>
</body>
</html>
`;
