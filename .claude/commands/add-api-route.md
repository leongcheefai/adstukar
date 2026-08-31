Add a new API route to `apps/api` following the module pattern.

Ask the user for the feature name and what HTTP methods/endpoints are needed, then:

1. Define the API boundary in `packages/contracts`:
   - Request schemas belong in `src/inputs/<feature>.ts` when the endpoint accepts input.
   - Response schemas belong in `src/modules/<feature>.ts`.
   - Export runtime schemas from `packages/contracts/src/index.ts` and frontend-safe types from `packages/contracts/src/types.ts` when needed.

2. Create or extend `apps/api/src/modules/<feature>/`:
   - `<feature>.routes.ts` — Hono router that validates input with `@hono/zod-validator` and parses responses with the shared output contract.
   - `<feature>.service.ts` — add when business logic should remain independent of Hono.

3. In `<feature>.routes.ts`, protect endpoints that require auth:
   ```ts
   const user = c.get('user')
   if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
   ```

4. Mount the router in `apps/api/src/lib/app.ts`:
   ```ts
   import { featureRouter } from '../modules/<feature>/<feature>.routes'
   app.route('/<feature>', featureRouter)
   ```

5. Run `pnpm verify`.

Follow `billing` for a route/service split and `me` for a route-only module. All env access goes through `serverEnv` from `@repo/env` — never `process.env`.
