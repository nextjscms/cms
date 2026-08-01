# Next.js CMS (Core)

A modern, fast, and highly customizable Headless/Integrated CMS built with Next.js 15, React, and Drizzle ORM.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnextjscms%2Fcms&env=DATABASE_URL&root-directory=packages%2Fcore)

## Features

- **Modern Tech Stack**: Built with Next.js (App Router) and React.
- **Database Agnostic**: Uses Drizzle ORM for robust and type-safe database interactions.
- **Custom Post Types**: Create dynamic, schema-driven custom post types with custom fields.
- **Rich Text Editor**: Integrated TipTap editor with Notion-style slash commands and markdown support.
- **Admin Dashboard**: Beautiful, responsive admin UI built with Tailwind CSS and Radix UI primitives.
- **Media Management**: Simple and effective media picker for handling images and uploads.
- **Dynamic Routing**: Catch-all dynamic routing (`[[...slug]]`) for seamless frontend rendering.
- **Dynamic Theming**: Support for multiple themes injected with real-time CSS variables for dynamic customizer preview.

## Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- A compatible database (e.g., PostgreSQL, Neon)

### Installation & Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file and add your database URL:
   ```bash
   DATABASE_URL="postgresql://user:password@host/db"
   ```

3. **Run Database Migrations:**
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Run Setup:**
   Open [http://localhost:3000/setup](http://localhost:3000/setup) to finalize your site setup and create an admin account.

## Deploying to Vercel

You can easily deploy NextjsCMS to Vercel using the button above. 

**Important details for deployment:**
1. Make sure to provide a valid `DATABASE_URL` during the Vercel setup. (We recommend [Neon](https://neon.tech/) for serverless Postgres).
2. The Vercel build will automatically detect Next.js.
3. Once deployed, visit your domain to either proceed with the `/setup` flow (if starting from a fresh database) to run migrations, or configure your build command in Vercel to `npm run db:push && next build` if you prefer CLI migrations.

## Architecture

- **`src/app/admin`**: Contains the admin dashboard UI and logic.
- **`src/app/(frontend)`**: Contains the dynamic routing for rendering pages and posts.
- **`src/app/setup`**: The onboarding experience and database initialization.
- **`src/db`**: Contains Drizzle ORM schema definitions.
- **`src/themes`**: Contains frontend theme templates.

## License

MIT
