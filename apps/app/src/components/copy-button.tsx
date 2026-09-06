import { Check, Copy } from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "outline",
  className,
}: {
  value: string;
  label?: string;
  size?: "sm" | "icon";
  /** `ghost` draws no box, for an icon that sits inside a field. */
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Select the text and copy it by hand.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      aria-label={label}
      className={className}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {size === "sm" && (copied ? "Copied" : label)}
    </Button>
  );
}
