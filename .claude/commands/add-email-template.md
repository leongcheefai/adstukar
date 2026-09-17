Add a new transactional email template to `packages/emails`.

Ask the user for the email name, recipient context, and what data it needs (e.g. user name, action URL), then:

1. Create `packages/emails/src/templates/<name>.tsx` — a React component returning plain HTML. Use `<html>`, `<head>`, `<body>`, `<p>`, `<a>` tags. Include charset and viewport meta in `<head>`:
   ```tsx
   <head>
     <meta charSet="utf-8" />
     <meta name="viewport" content="width=device-width" />
   </head>
   ```

2. Add a sender function in `packages/emails/src/index.ts`:
   ```ts
   export async function sendInviteEmail(to: string, url: string) {
     await send(to, 'You are invited', InviteEmail({ url }))
   }
   ```

3. Call the sender from the appropriate trigger point:
   - Auth events → `packages/auth/src/index.ts` (`databaseHooks` or `emailAndPassword` callbacks)
   - Use fire-and-forget (`.catch()`) for non-critical emails; `await` for transactional flows where failure should surface to the user

4. Run `pnpm verify`.

The sender is safe to call without `RESEND_API_KEY`; it skips delivery and logs a console warning. Product name and sender address come from `@repo/config/project`.
