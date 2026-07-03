# DeFi Note

DeFi Note is a static website for organizing DeFi history, protocol notes, categories, sources, and research methods.

## Pages

- `index.html`: Home
- `defi_timeline.html`: Detailed DeFi timeline
- `timeline.html`: Timeline index
- `protocols.html`: Protocol index
- `categories.html`: Category index
- `sources.html`: Sources and references
- `deep-research.html`: Deep research notes
- `research-method.html`: Research method
- `underworld.html`: Risk and incident notes

## Structure

```text
assets/
  defi-data.js   Shared DeFi data
  site.css       Shared styles
  site.js        Shared browser behavior

*.html           Static pages served from the repository root
build_multisite.js
                 Node.js script used to generate or update site pages
```

## Local Preview

Open `index.html` directly in a browser, or run a local static server from the repository root.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Updating

1. Edit the source data or HTML pages.
2. Run `node build_multisite.js` if the generated pages need to be rebuilt.
3. Check the pages in a browser.
4. Commit and push changes to `main`.

## GitHub Pages

This repository is configured to publish GitHub Pages from the `main` branch and repository root.
The `.nojekyll` file disables Jekyll processing so the files are served as-is.
