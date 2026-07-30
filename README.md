# Next.js CMS

A modern, fast, and highly customizable Headless/Integrated CMS built with Next.js 15, React, and Drizzle ORM.

## Features

- **Modern Tech Stack**: Built with Next.js (App Router) and React.
- **Database Agnostic**: Uses Drizzle ORM for robust and type-safe database interactions.
- **Custom Post Types**: Create dynamic, schema-driven custom post types with custom fields.
- **Rich Text Editor**: Integrated TipTap editor with Notion-style slash commands and markdown support.
- **Admin Dashboard**: Beautiful, responsive admin UI built with Tailwind CSS and Radix UI primitives.
- **Media Management**: Simple and effective media picker for handling images and uploads.
- **Dynamic Routing**: Catch-all dynamic routing (`[[...slug]]`) for seamless frontend rendering.

## Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- A compatible database (e.g., PostgreSQL, SQLite, MySQL)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and add your database URL.
   ```bash
   cp .env.example .env.local
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   # or the specific migration command you have configured
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

- **`packages/core/src/app/admin`**: Contains the admin dashboard UI and logic.
- **`packages/core/src/app/(frontend)`**: Contains the dynamic routing for rendering pages and posts.
- **`packages/core/src/db`**: Contains Drizzle ORM schema definitions.
- **`packages/core/src/themes`**: Contains frontend theme templates.

## License

MIT
