# eVote - Modern Electronic Voting Platform

eVote is a full-stack electronic voting application built with Next.js, React, Tailwind CSS, and ShadCN UI. It allows administrators to create, manage, and customize polls, while users can easily cast their votes. The platform supports features like scheduled poll closing, vote limits per client, multi-select voting, and internationalization.

## ✨ Features

*   **Dynamic Poll Creation & Management**: Admins can create polls with custom titles, candidates, and various settings.
*   **Candidate Management**: Add candidates with names and upload custom avatars.
*   **Flexible Poll Settings**:
    *   Manually open/close polls.
    *   Schedule automatic poll closing times.
    *   Enable/disable vote limiting per client (browser-based) and set the maximum number of votes.
    *   Configure polls for single-select or multi-select voting, with a definable maximum number of selections for multi-select.
*   **User Voting Interface**: Intuitive interface for users to select polls and cast votes for their chosen candidates.
*   **Results Display**: View poll results, including vote distribution per candidate and an animated ticker tape of candidate headshots. Users can select specific polls to view their results.
*   **Admin-Controlled Results Visibility**: Admins can toggle whether poll results are publicly visible or private.
*   **Customizable UI Texts**: Admins can edit key introductory texts on the Home page and Vote page directly from the admin dashboard.
*   **Internationalization (i18n)**: Supports English (en) and Simplified Chinese (zh-CN) with easy language switching.
*   **Password-Protected Admin Section**: Secure admin area for managing polls and application settings.
*   **Session Management**: Uses `iron-session` for secure admin session handling.
*   **Database Backend**: Configured to use a PostgreSQL database (e.g., Neon) for persistent storage of polls, candidates, votes, and application settings.

## 🛠️ Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **UI**: React, ShadCN UI
*   **Styling**: Tailwind CSS
*   **Database**: PostgreSQL (intended for services like Neon, using `@neondatabase/serverless`)
*   **Session Management**: `iron-session`
*   **Icons**: `lucide-react`
*   **Internationalization**: Custom solution using JSON files and React Context.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm, yarn, or pnpm
*   A PostgreSQL database (e.g., a free tier Neon database)

### Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd eVote
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root of your project and add the following variables:

    ```env
    # Neon Database Connection String
    DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

    # Admin Password for accessing /admin
    ADMIN_PASSWORD="your_secure_admin_password"

    # Session Secret (at least 32 characters long, strong random string)
    # You can generate one using: openssl rand -hex 32
    SESSION_SECRET="your_very_strong_and_random_session_secret_key_at_least_32_chars"
    ```
    Replace placeholders with your actual values.

4.  **Database Schema Setup**:
    *   The application includes a basic schema initialization function (`src/lib/server/db.ts`) that attempts to create necessary tables (`polls`, `candidates`, `app_settings`) and default settings if they don't exist. This is primarily for **development convenience** and runs when API routes are first hit in a development environment.
    *   **For Production (e.g., when deploying to Vercel)**: It is **strongly recommended** to use a dedicated database migration tool (like Prisma Migrate, Drizzle Kit, Flyway, or Liquibase) or manually execute the SQL DDL statements found within the `initializeDbSchema` function in `src/lib/server/db.ts` to set up your database schema before deploying. The automatic schema creation is disabled in production environments.

### Running the Application

1.  **Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002` (or another port if 9002 is in use).

2.  **Production Build**:
    ```bash
    npm run build
    ```

3.  **Start Production Server**:
    ```bash
    npm run start
    ```

## 🔑 Admin Access

*   Navigate to `/admin` in your browser.
*   Enter the password you set in the `ADMIN_PASSWORD` environment variable.
*   The Admin Dashboard allows you to:
    *   Create new polls.
    *   Edit existing polls (title, candidates, status, close time, vote limits, multi-select settings).
    *   Toggle poll status (Open/Closed).
    *   Delete polls.
    *   Control global results visibility (Public/Private).
    *   Customize introductory texts for the Home and Vote pages for different languages.

## 🗳️ Using the Application

*   **Home Page**: Displays a welcome message and a link to the voting section.
*   **Vote Page**:
    *   Lists all available polls.
    *   Users select a poll to view its candidates.
    *   Users can cast their vote(s) based on the poll's configuration (single or multi-select, vote limits).
*   **Results Page**:
    *   Displays election results.
    *   Users can select a specific poll from a dropdown to view its results.
    *   Shows the winning candidate (if any), vote distribution, and a bar chart overview.
    *   Visibility is subject to admin settings.
*   **Language Switcher**: Located in the header, allowing users to toggle between English and Simplified Chinese.

## ☁️ Deployment to Vercel

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import your project into Vercel.
3.  **Configure Environment Variables** in your Vercel project settings (Project > Settings > Environment Variables) with the same keys and values as in your `.env.local` file (`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`).
4.  **Set up your production database schema** manually or using a migration tool before or during your first deployment.
5.  Vercel will automatically build and deploy your application.

## 💡 Potential Future Enhancements

*   More robust user authentication (e.g., OAuth) for voters if individual tracking is needed.
*   Server-side enforcement of vote limits (requires user accounts).
*   Real-time updates for the results page (e.g., using WebSockets or Vercel's real-time features).
*   Advanced analytics and reporting for poll results.
*   Option to generate unique, non-guessable voting links per poll.