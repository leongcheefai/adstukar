import { cn } from "../lib/utils";

export interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatarSrc?: string;
  className?: string;
}

export function Testimonial({ quote, author, role, avatarSrc, className }: TestimonialProps) {
  return (
    <figure
      className={cn("flex flex-col gap-6 rounded-2xl border border-border bg-card p-8", className)}
    >
      <blockquote className="text-base leading-7 text-foreground">
        <p>&ldquo;{quote}&rdquo;</p>
      </blockquote>
      <figcaption className="flex items-center gap-4">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={author}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {author[0]}
          </div>
        )}
        <div>
          <div className="font-semibold text-foreground">{author}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}
