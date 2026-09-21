import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui";
import { type ComponentProps, useState } from "react";

const REASONS = [
  "Bug",
  "Missing feature",
  "Account",
  "Wallet and payouts",
  "Advertising",
  "Other",
] as const;

const MESSAGE_MAX = 2000;

/**
 * The direct message on the help home. UI only for now: nothing takes the
 * message yet, so Send checks the two fields, shows the confirmation, and
 * drops the text. Wire `onSubmit` to a route before this ships.
 */
export function HelpMessageForm() {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    if (!reason) {
      setError("Select a reason.");
      return;
    }
    if (!message.trim()) {
      setError("Write your message.");
      return;
    }
    setError(null);
    setReason("");
    setMessage("");
    setSent(true);
  };

  return (
    <section
      aria-labelledby="help-message"
      className="mx-auto mt-12 max-w-xl border-t border-border pt-10"
    >
      <h2 id="help-message" className="text-xl font-medium tracking-tight">
        Send us a direct message
      </h2>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="help-reason">Reason</Label>
          <Select
            value={reason}
            onValueChange={(value) => {
              setReason(value);
              setError(null);
              setSent(false);
            }}
          >
            <SelectTrigger id="help-reason" className="h-11 w-full bg-card">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="help-message-text">Message</Label>
          <Textarea
            id="help-message-text"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setError(null);
              setSent(false);
            }}
            maxLength={MESSAGE_MAX}
            rows={6}
            placeholder="Tell us what occurred, and what you expected."
            className="min-h-36 bg-card text-base"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg">
            Send
          </Button>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <output className="text-sm text-muted-foreground">{sent && "Message sent."}</output>
        </div>
      </form>
    </section>
  );
}
