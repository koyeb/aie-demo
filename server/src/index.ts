import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createUserSubmissionInputSchema } from './schema';
import { submitEmailAndPicture } from './handlers/submit_email_and_picture';
import { getUserSubmissions } from './handlers/get_user_submissions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Main endpoint for submitting email and picture
  submitEmailAndPicture: publicProcedure
    .input(createUserSubmissionInputSchema)
    .mutation(({ input }) => submitEmailAndPicture(input)),
    
  // Admin endpoint to get all submissions
  getUserSubmissions: publicProcedure
    .query(() => getUserSubmissions()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();