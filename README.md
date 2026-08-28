# Ash App Store

A dark, developer-themed web app to showcase and distribute self-built software. App metadata is auto-fetched live from the GitHub public API.

## Features

- Dark developer theme (monospace accents, `>_` logo, `#0a0a0a` background)
- **Auto-fetch from GitHub**: just list `owner`/`repo` — name, description, language, stars, last-updated, topics, and icon are fetched automatically from the GitHub public API
- **Auto category detection**: infers category from repo topics + primary language (CLI Tools, Web Apps, Productivity, AI & ML, Dev Tools, Utilities, Health & Fitness)
- Category filter pills with live counts
- Sort by Recently Updated, Most Stars, or A–Z
- Grid / List view toggle
- Search by name, description, or language
- App detail modal with full repo metadata
- Install button for direct APK / web app links
- Share button (Web Share API with clipboard fallback)
- Keyboard shortcut: `/` focuses search, `Esc` closes modal
- SEO-friendly metadata
- Responsive layout for desktop and mobile

## Project Structure

- `index.html` — Main page structure and SEO metadata (dark theme)
- `styles.css` — Dark developer theme styling and responsive rules
- `script.js` — GitHub auto-fetch, category inference, rendering, filtering, and modal logic
- `favicon.svg` — Site favicon (dark theme)

## Run Locally

No build step is required.

1. Open the project folder.
2. Open `index.html` in a browser (or serve with `python3 -m http.server`).

> **Note:** GitHub API auto-fetch requires the page to be served over `http://` or `https://` (not `file://`) due to CORS.

## SEO Included

The page currently includes:

- Optimized title and description
- Open Graph tags
- Twitter card tags
- Robots directives
- JSON-LD (`WebSite`) structured data

## Customization

### Add new apps

Edit the `APP_REPOS` array in `script.js`. You can use either a plain GitHub URL string or an object — everything else is auto-fetched:

```js
const APP_REPOS = [
  "https://github.com/its-ash/workout",
  "https://github.com/its-ash/bulk-uninstaller",
  { owner: "its-ash", repo: "my-app", link: "https://github.com/its-ash/my-app/releases/download/v1.0/app.apk" },
];
```

When a plain URL string is used:
- `owner` and `repo` are parsed from the URL
- The install/link defaults to the GitHub Pages URL (`https://{owner}.github.io/{repo}/`)
- To override the link, use the object form with a `link` field instead

### What gets auto-fetched from GitHub

| Field | Source |
|-------|--------|
| Name | `repo.name` |
| Description | `repo.description` |
| Language | `repo.language` |
| Stars | `repo.stargazers_count` |
| Last updated | `repo.updated_at` |
| Topics | `GET /repos/{owner}/{repo}/topics` |
| Icon | Probes common paths (`public/icon.svg`, `public/favicon.png`, `logo.png`, etc.) |
| Category | Inferred from topics + language |

### Category inference

Categories are auto-detected from repo topics and primary language. See the `CATEGORY_KEYWORDS` map in `script.js` to customize keyword → category mappings.

### Rate limiting

The GitHub public API allows ~60 unauthenticated requests per hour per IP. Each repo costs 2 API calls (repo + topics) plus up to 5 HEAD probes for icon detection. For larger app lists, consider adding a GitHub token.

### Optional manual overrides

You can still pass manual fields in `APP_REPOS` entries to override auto-fetched data:

```js
{ owner: "its-ash", repo: "my-app", link: "...", name: "Custom Name", category: "Web Apps", icon: "https://..." }
```

## Notes

- For best SEO results, set canonical URL, sitemap, and robots.txt after deploying with a final domain.
- Direct APK links should point to trusted release artifacts.
- GitHub API auto-fetch works client-side; for production with many repos, add a token or cache responses server-side.
