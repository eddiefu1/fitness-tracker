This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Push this repo to GitHub (or GitLab / Bitbucket).
2. Import the repo in [Vercel](https://vercel.com/new): framework **Next.js**, build `npm run build`, output default.
3. **FatSecret is optional.** If you do not set `FATSECRET_CLIENT_ID` / `FATSECRET_CLIENT_SECRET`, food search uses **Open Food Facts** only—no FatSecret keys are required on Vercel. To force that even when keys exist locally, set `DISABLE_FATSECRET=1` in the environment. The weekly summary is computed in the browser and needs no LLM env vars.

Or deploy from the CLI: run `npx vercel` in the project root, then `npx vercel --prod` for production.
