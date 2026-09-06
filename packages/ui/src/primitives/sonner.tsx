import { CheckCircle, CircleNotch, Info, Warning, WarningOctagon } from "@phosphor-icons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" />,
        info: <Info className="size-4" />,
        warning: <Warning className="size-4" />,
        error: <WarningOctagon className="size-4" />,
        loading: <CircleNotch className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-bg-surface)",
          "--normal-text": "var(--color-text)",
          "--normal-border": "var(--color-border)",
          "--border-radius": "var(--radius-lg)",
          "--toast-shadow": "var(--elev-2)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
