# Deployment Guide

## Vercel Deployment

This project is configured for deployment on Vercel. Follow these steps to deploy:

### Prerequisites

- Vercel account (https://vercel.com/signup)
- Git repository connected to Vercel
- Node.js 20.x or later

### Automatic Deployment

The easiest way to deploy is using Vercel's GitHub integration:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`
   - Click "Deploy"

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **For production**
   ```bash
   vercel --prod
   ```

### Configuration

The `vercel.json` file contains the deployment configuration:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/spa",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables

Set environment variables in the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

- `NODE_ENV`: `production` (auto-set by Vercel)
- `PING_MESSAGE`: (optional) Custom message for `/api/ping`
- Any Firebase or external service credentials needed

### Build Process

The build process consists of:

1. **Client Build** (`pnpm build:client`)
   - Compiles React/TypeScript code with Vite
   - Outputs to `dist/spa`
   - Produces optimized SPA bundle

2. **Server Build** (`pnpm build:server`)
   - Bundles Express server with serverless-http
   - Outputs to `dist/server`
   - Used by Vercel serverless functions

3. **API Routes**
   - `/api/[[...route]].ts` is the catch-all serverless function handler
   - Handles all API endpoints defined in `server/index.ts`

### Deployment Checklist

- [ ] All TypeScript errors fixed (`pnpm typecheck`)
- [ ] Local build successful (`pnpm build`)
- [ ] Environment variables configured in Vercel dashboard
- [ ] Git repository pushed to GitHub
- [ ] Project connected to Vercel
- [ ] Deployment successful with no 5xx errors
- [ ] API endpoints responding correctly
- [ ] Frontend loads without errors

### Troubleshooting

**Build fails with module not found:**
- Clear Vercel cache: Go to project settings → Git → Rebuild
- Ensure all dependencies are in `package.json`
- Check `.vercelignore` for excluded files

**API endpoints returning 404:**
- Verify `api/[[...route]].ts` exists
- Check that endpoints are registered in `server/index.ts`
- Test locally with `pnpm dev`

**Frontend shows 404 on refresh:**
- Verify `vercel.json` has correct rewrites for React Router
- Check that `dist/spa` contains `index.html`

**Slow performance:**
- Review Vercel analytics dashboard
- Check for large dependencies or code chunks
- Consider code-splitting or lazy loading routes

### Local Testing

Before deploying, test the production build locally:

```bash
# Build
pnpm build

# Install global vercel CLI (optional)
npm i -g vercel

# Test locally
vercel dev
```

Then visit `http://localhost:3000` to test the complete build.

### Production URLs

- Frontend: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/*`

### Database/Backend Services

If your application uses external services (Neon, Supabase, etc.):

1. Create accounts and get connection strings
2. Add environment variables to Vercel dashboard
3. Update code to use `process.env.YOUR_VAR_NAME`
4. Redeploy or restart builds

### Monitoring

Use Vercel's built-in monitoring:
- **Deployments**: View deployment history and logs
- **Analytics**: Monitor performance metrics
- **Functions**: Check serverless function performance
- **Speed Insights**: Monitor Core Web Vitals

### Support

- Vercel Docs: https://vercel.com/docs
- This project's GitHub: [Your repository URL]
- Framework docs: https://react.dev (React), https://vitejs.dev (Vite)
