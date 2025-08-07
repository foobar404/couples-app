# Deployment Guide

## GitHub Pages Automatic Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Steps

1. **Push to Main Branch**: The deployment triggers automatically when you push to the `main` branch.

2. **Enable GitHub Pages**: 
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

3. **Configure Permissions**:
   - Go to repository Settings > Actions > General
   - Under "Workflow permissions", select "Read and write permissions"

### Manual Deployment

If you need to deploy manually:

```bash
# Install gh-pages (if not already installed)
npm install --save-dev gh-pages

# Build and deploy
npm run build
npx gh-pages -d dist
```

### Environment Variables

For production deployment, you may need to set environment variables:

- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `VITE_FIREBASE_DATABASE_URL`: Your Firebase database URL
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID

### Deployment URL

The app will be available at: `https://[username].github.io/couples-app/`

### Troubleshooting

1. **404 on GitHub Pages**: Make sure the repository is public or you have GitHub Pro/Team
2. **Build Fails**: Check that all dependencies are in `package.json` (not just `devDependencies`)
3. **PWA Not Working**: Ensure HTTPS is enabled (GitHub Pages provides this automatically)
