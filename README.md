# SiKap System (Next.js + Prisma + Neon + NextAuth + Gemini)

Dynamic Youth Skills Profiling, Matchmaking, and Decision-Support Platform for San Luis, Pampanga.

## 🚀 Modernized Tech Stack
- **Frontend Framework**: Next.js 15 (App Router, Client & Server Components)
- **Backend & APIs**: Next.js Route Handlers (`/app/api/*`)
- **Styling**: Tailwind CSS v4, Shadcn UI primitives, Motion, Lucide Icons
- **Database & ORM**: Neon Serverless PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (JWT) with Role-Based Access Control
- **Security & Encryption**: AES-256-GCM field-level encryption for sensitive PII
- **Matchmaking Engine**: Content-Based Filtering (CBF) algorithm
- **AI / LLM**: Google Gemini API (`@google/genai`)

## 🛠️ Run Locally

### Prerequisites
- Node.js (v18+)

### Installation & Execution

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `AES_SECRET_KEY`, and `GEMINI_API_KEY` in `.env`.

3. **Push Prisma Database Schema**:
   ```bash
   npm run db:push
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```
