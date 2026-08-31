# packages/emails

## Purpose
Transactional email sending via Resend. Renders React Email templates to HTML and delivers them. If `RESEND_API_KEY` is not set, sends are skipped with a console warning, so the app still boots without Resend credentials.

## Conventions
- The public API is the named sender functions exported from `src/index.ts`, currently covering welcome, verification, password reset, payment failure, email change, and account deletion
- Templates are React components returning plain HTML — no external CSS, no images; style with inline styles or `@react-email/components` if needed
- Callers decide sync vs fire-and-forget: `packages/auth` uses `.catch()` for welcome; `apps/api` uses `.catch()` for payment-failed; verify and reset are `await`ed intentionally

## Common tasks

### Add a new email template
1. Create `src/templates/<name>.tsx` — a React component returning plain HTML
2. Add a `send<Name>Email(to: string, ...)` function in `src/index.ts` calling `send()`
3. Export it from `src/index.ts`

### Change the sender address
Update `email.from` in `packages/config/src/project.ts`. The domain must be verified in the Resend dashboard before going live.

### Test emails locally
Set `RESEND_API_KEY` in the root `.env`. Leave it unset to skip sends with a console warning.

## Gotchas
- `RESEND_API_KEY` absent = logged no-op, not an error; check `console.warn` output to confirm skips
- The configured `email.from` address will fail sending until its domain is verified in Resend
- Templates are plain HTML stubs — functional but unstyled; visual polish is deferred
- No build step — TypeScript source exported directly
