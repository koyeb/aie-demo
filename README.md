This is a client-side only React application for AI photo demo, created with [app.build](https://app.build), an open-source platform for AI app development.

Core stack:
- React 19 with [Vite](https://vitejs.dev) for the frontend;
- TypeScript for type safety;
- [shadcn/ui](https://ui.shadcn.com) for UI components;
- [Tailwind CSS](https://tailwindcss.com) for styling;
- [Zod](https://zod.dev) for schema validation.

The app can be run locally:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

- `client/` - React frontend application with camera capture and photo submission functionality
- `tests/` - Playwright tests for end-to-end testing

The application allows users to capture photos using their device camera and submit them along with an email address. All processing is done client-side with no backend required.
