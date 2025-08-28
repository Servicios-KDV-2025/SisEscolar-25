import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export interface PaymentSuccessData {
  // Transaction details
  orderNumber: string
  paymentDate: string
  paymentMethod: string
  totalAmount: string
  currency?: string

  // Order items
  orderItems: Array<{
    name: string
    price: string
  }>

  // Tax and totals
  subtotal: string
  taxes: string

  // Configuration
  title?: string
  subtitle?: string
  dashboardUrl?: string
  homeUrl?: string
  supportEmail?: string
  supportPhone?: string

  // Next steps (optional)
  nextSteps?: Array<{
    text: string
  }>

  // Colors (optional customization)
  accentColor?: string
}

interface PaymentSuccessBlockProps {
  data: PaymentSuccessData
}

export default function PaymentSuccessBlock({ data }: PaymentSuccessBlockProps) {
  const {
    orderNumber,
    paymentDate,
    paymentMethod,
    totalAmount,
    currency = '$',
    orderItems,
    subtotal,
    taxes,
    title = '¡Pago Exitoso!',
    subtitle = 'Tu transacción se ha procesado correctamente',
    dashboardUrl = '/dashboard',
    homeUrl = '/',
    supportEmail = 'soporte@tuempresa.com',
    supportPhone = '+1 (234) 567-890',
    nextSteps,
    accentColor = 'green',
  } = data

  // Dynamic color classes based on accent color
  const colorClasses = {
    green: {
      bg: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      totalColor: 'text-green-600 dark:text-green-400',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      linkColor: 'text-green-600 dark:text-green-400',
      dotColor: 'bg-green-500',
    },
    blue: {
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      totalColor: 'text-blue-600 dark:text-blue-400',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      linkColor: 'text-blue-600 dark:text-blue-400',
      dotColor: 'bg-blue-500',
    },
  }

  const colors = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.green

  const defaultNextSteps = [
    { text: 'Recibirás un email de confirmación en los próximos minutos' },
    { text: 'Tu cuenta será activada automáticamente' },
    { text: 'Podrás acceder a todas las funciones premium inmediatamente' },
  ]

  const stepsToShow = nextSteps || defaultNextSteps

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${colors.bg} flex items-center justify-center p-4`}
    >
      <div className="w-full max-w-2xl">
        {/* Success Icon and Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 ${colors.iconBg} rounded-full mb-6`}
          >
            <CheckCircle className={`w-12 h-12 ${colors.iconColor}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Transaction Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Detalles de la Transacción
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Número de Orden</p>
                    <p className="font-mono text-lg font-medium">{orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                    <p className="font-medium">{paymentDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Método de Pago</p>
                    <p className="font-medium">{paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pagado</p>
                    <p className={`text-2xl font-bold ${colors.totalColor}`}>
                      {currency}
                      {totalAmount}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Resumen del Pedido
                </h3>
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                      <span className="font-medium">
                        {currency}
                        {item.price}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Impuestos</span>
                    <span className="font-medium">
                      {currency}
                      {taxes}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total</span>
                    <span className={colors.totalColor}>
                      {currency}
                      {totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ¿Qué sigue?
            </h3>
            <div className="space-y-3">
              {stepsToShow.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 ${colors.dotColor} rounded-full mt-2 flex-shrink-0`}
                  ></div>
                  <p className="text-gray-600 dark:text-gray-400">{step.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className={colors.buttonBg}>
            <Link href={dashboardUrl} className="flex items-center gap-2">
              Ir al Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Descargar Recibo
          </Button>

          <Button variant="ghost" size="lg" asChild>
            <Link href={homeUrl} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Necesitas ayuda? Contáctanos en{' '}
            <a href={`mailto:${supportEmail}`} className={`${colors.linkColor} hover:underline`}>
              {supportEmail}
            </a>{' '}
            o llama al{' '}
            <a href={`tel:${supportPhone}`} className={`${colors.linkColor} hover:underline`}>
              {supportPhone}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
