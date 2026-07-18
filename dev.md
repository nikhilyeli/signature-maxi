# Developer Guide

Welcome to the Signature Maxi development environment. This guide outlines everything you need to know to get the project running locally, modify components, and deploy the application.

## Prerequisites
- **Node.js**: v20 or later
- **npm**: v11 or later
- **Angular CLI**: v21.1+

## 🚀 Getting Started

1. **Install Dependencies**
   Run the following command in the project root:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run Local Development Server**
   Start the Angular CLI server:
   ```bash
   npm start
   ```
   Navigate to `http://localhost:8231/` (or whichever port is assigned). The app will automatically reload if you change any of the source files.

## 📁 Project Structure
The primary logic for Signature Maxi resides in `src/components/signature-maxi`:

- **`signature-maxi.ts`**: The main dashboard. Orchestrates the settings panel, signature modes, watermark configurations, and the overall state.
- **`signature-capture.ts`**: The core component that handles drawing, typing, uploading, and capturing camera inputs.
- **`signature-dialog.ts`**: The modal orchestrator. It displays the `signer-list` and the `signature-capture` components in a split layout.
- **`signature-maxi.service.ts`**: The reactive state management service. All operations use RxJS `BehaviorSubject` to broadcast state updates.

## 🛠️ Build Commands

### Standard Build
To build the project for standard production deployment:
```bash
npm run build
```
The build artifacts will be stored in the `dist/` directory.

### GitHub Pages Build
To build the project specifically for GitHub Pages (which adjusts the `<base href>` to `./`):
```bash
npm run build:gh-pages
```

## 🌐 Deployment (GitHub Actions)
This project is configured with a continuous deployment pipeline using GitHub Actions.

Status

[![Deploy to GitHub Pages](https://github.com/nikhilyeli-hcl/signature-maxi/actions/workflows/deploy.yml/badge.svg?branch=master)](https://github.com/nikhilyeli-hcl/signature-maxi/actions/workflows/deploy.yml)

[![pages-build-deployment](https://github.com/nikhilyeli-hcl/signature-maxi/actions/workflows/pages/pages-build-deployment/badge.svg?branch=gh-pages)](https://github.com/nikhilyeli-hcl/signature-maxi/actions/workflows/pages/pages-build-deployment)

The deployment script is located at `.github/workflows/deploy.yml`. When you push to the `master` branch, the workflow will automatically:
1. Install dependencies
2. Build the project using `npm run build:gh-pages`
3. Push the compiled `/dist` output to the remote `gh-pages` branch.

**Note on Committer Email**: If you previously ran manual deploys that used your local email address on the `gh-pages` branch, you can safely delete the remote `gh-pages` branch. The GitHub Action will automatically recreate the branch on your next push, utilizing the anonymous GitHub Actions bot email.
