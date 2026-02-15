# Pounce Deployment Guide

## GitHub Pages Deployment

### One-Time Setup

1. **Enable GitHub Pages**
   - Go to your repository on GitHub: https://github.com/rohitksingh/Pounce
   - Click **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: **GitHub Actions**
   - Click **Save**

2. **Push to Main Branch**
   - The GitHub Actions workflow will automatically deploy
   - First deployment takes ~1-2 minutes
   - Subsequent deployments take ~30-60 seconds

3. **Access Your Game**
   - URL: `https://rohitksingh.github.io/Pounce/`
   - Game will be live after first deployment completes

### Automatic Deployments

- Push to `main` → Automatic deployment
- View deployment status: Actions tab in GitHub
- Deployment time: ~30-60 seconds

### Monitoring Deployments

1. Go to your repository on GitHub
2. Click **Actions** tab
3. See all deployment runs
4. Click any run to see detailed logs

### Troubleshooting

**If deployment fails:**
1. Check Actions tab for error logs
2. Common issues:
   - Build errors (check TypeScript compilation)
   - Missing dependencies (check package.json)
   - Base path incorrect in vite.config.ts

**If game loads but assets don't:**
1. Check that base path in vite.config.ts matches repo name exactly
2. Should be `/Pounce/` (case-sensitive)
3. Check browser console for 404 errors

**Build errors locally:**
1. Run `npm run build` to test build
2. Fix any TypeScript errors
3. Ensure all dependencies are installed

### Custom Domain (Optional)

1. Go to Settings → Pages
2. Add your custom domain
3. Configure DNS with your domain provider
4. GitHub provides free HTTPS

### Local Testing

To test the production build locally with the GitHub Pages base path:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Open http://localhost:4173/Pounce/ and verify:
- Game loads correctly
- All sprites and assets render
- No console errors
- Smooth gameplay

## Build Configuration

The project uses:
- **Build command**: `npm run build` (runs TypeScript check + Vite build)
- **Output directory**: `dist`
- **Framework**: Vite 5.x
- **Base path**: `/Pounce/` (matches repository name)
- **TypeScript**: Strict mode enabled
- **Asset handling**: Automatic optimization via Vite

## CI/CD Pipeline

GitHub Actions automatically:
1. Detects pushes to `main` branch
2. Installs dependencies with `npm ci`
3. Runs TypeScript compiler
4. Builds production bundle
5. Deploys to GitHub Pages
6. Makes game live at https://rohitksingh.github.io/Pounce/

## Performance Optimization

The current configuration includes:
- Minification via esbuild
- Asset optimization via Vite
- TypeScript compilation before build
- .nojekyll file for faster GitHub Pages processing

## Files Configuration

Key files for deployment:
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vite.config.ts` - Build configuration with base path
- `public/.nojekyll` - Disables Jekyll processing
- `dist/` - Build output (auto-generated, not committed)
