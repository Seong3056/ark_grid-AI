<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1loDwOk1y_IEEMupve-aEg29m9cTTwxQq

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
   `npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss`
2. Set the API keys in [.env.local](.env.local):
   - `GEMINI_API_KEY`: Your Gemini API key
   - `LOST_ARK_API_KEY`: Your Lost Ark API key (from developer portal)
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

1. Build the project:
   `npm run build`
2. Commit and push the `dist` folder to your GitHub repository.
3. In your repository settings, go to Pages and set the source to `Deploy from a branch` and select the `main` branch and `/dist` folder.
4. Your app will be available at `https://yourusername.github.io/lost-ark-ark-grid-optimizer/`

**Note:** API keys are required for the app to function. For GitHub Pages deployment, build locally with your API keys in .env.local, then upload the dist folder. Do not commit API keys to the repository.
