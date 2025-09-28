// Componente Form básico para compatibilidad
import * as React from "react";

export const Form = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form ref={ref} className={className} {...props} />
));

Form.displayName = "Form";

export const FormField = ({ children }: { children: React.ReactNode }) => children;
export const FormItem = ({ children }: { children: React.ReactNode }) => children;
export const FormLabel = ({ children }: { children: React.ReactNode }) => children;
export const FormControl = ({ children }: { children: React.ReactNode }) => children;
export const FormMessage = ({ children }: { children: React.ReactNode }) => children;
