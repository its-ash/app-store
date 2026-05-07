# Ash Play Store

A lightweight Play Store-style web app to browse and install Android apps using direct APK links.

## Features

- Play Store-inspired UI
- Search apps by name or developer
- App cards with icon, title, developer, and rating
- Install button for direct APK download
- App detail modal with additional information
- SEO-friendly metadata and structured data
- Custom favicon support
- Responsive layout for desktop and mobile

## Project Structure

- `index.html` - Main page structure and SEO metadata
- `styles.css` - UI styling and responsive rules
- `script.js` - App data, rendering, filtering, and modal logic
- `favicon.svg` - Site favicon

## Run Locally

No build step is required.

1. Open the project folder.
2. Open `index.html` in a browser.

## SEO Included

The page currently includes:

- Optimized title and description
- Open Graph tags
- Twitter card tags
- Robots directives
- JSON-LD (`WebSite`) structured data

## Customization

### Add new apps

Edit the `appsData` array in `script.js`:

```js
const appsData = [
  {
    name: "Your App",
    icon: "https://example.com/icon.png",
    link: "https://example.com/app-release.apk"
  }
];
```

Optional fields supported by the app normalization:

- `developer`
- `rating`
- `downloads`
- `description`

## Notes

- For best SEO results, set canonical URL, sitemap, and robots.txt after deploying with a final domain.
- Direct APK links should point to trusted release artifacts.
