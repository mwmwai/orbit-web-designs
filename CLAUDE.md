## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Deployment

After every change to the site:

1. Verify with `npm run build`.
2. Commit and push to GitHub (`origin/main`, repo: mwmwai/orbit-web-designs).
3. Vercel auto-deploys the push and serves orbitwebdesigns.co.ke.

Use full paths for git/gh if they are not on PATH: `C:\Program Files\Git\bin\git.exe` and `C:\Program Files\GitHub CLI\gh.exe`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
