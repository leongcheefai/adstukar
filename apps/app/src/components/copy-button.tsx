import { Button } from "@repo/ui";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
}: {
  value: string;
  label?: string;
  size?: "sm" | "icon";
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
    <Button type="button" variant="outline" size={size} onClick={copy} aria-label={label}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {size === "sm" && (copied ? "Copied" : label)}
    </Button>
  );
}
