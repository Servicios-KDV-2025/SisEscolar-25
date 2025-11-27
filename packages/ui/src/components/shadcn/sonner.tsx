"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-white border border-gray-200 shadow-lg group",
          title: "font-semibold",
          description: "text-gray-600",
          actionButton: "bg-gray-900 text-white",
          cancelButton: "bg-gray-100 text-gray-900",
          success: "bg-white border-green-200 [&>div]:text-green-600",
          error: "bg-white border-red-200 [&>div]:text-red-600",
          info: "bg-white border-blue-200 [&>div]:text-blue-600",
          warning: "bg-white border-yellow-200 [&>div]:text-yellow-600",
        },
      }}
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "#111827",
          "--normal-border": "#e5e7eb",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
