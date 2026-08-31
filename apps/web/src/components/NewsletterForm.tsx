import { Button, Input, toast } from "@repo/ui";

export function NewsletterForm() {
  function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    toast.message("Connect your email provider", {
      description:
        "TODO: Wire this form to your provider (Resend, Loops, ConvertKit, etc.) to capture subscribers.",
    });
  }

  return (
    <div className="w-full">
      <p className="text-sm font-semibold">TODO: Newsletter headline</p>
      <p className="mt-1 text-sm text-muted-foreground">
        TODO: One-line description of what subscribers get.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          required
          aria-label="Email address"
          className="flex-1"
        />
        <Button type="submit">Subscribe</Button>
      </form>
    </div>
  );
}
