"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { type ToasterToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }: ToasterToast) {
        return (
          <Toast key={id} {...props} className={`${props.className || ''} border shadow-lg`}>
            <div className="grid gap-1">
              {title && <ToastTitle className="text-base font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="p-6 md:p-6 md:max-w-sm" />
    </ToastProvider>
  )
}
