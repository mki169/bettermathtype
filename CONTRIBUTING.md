# Contributing to BetterMathType

Thanks for taking the time to contribute. BetterMathType is a small, dependency-light project, and focused contributions are genuinely useful.

This guide covers:

- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project conventions](#project-conventions)
- [Issues](#issues)
- [Pull requests](#pull-requests)
- [Automated checks](#automated-checks)
- [Translations](#translations)
- [Review and merge](#review-and-merge)
- [License](#license)

## Ways to contribute

- **Report a bug.** Use the bug report issue form and include reproduction steps, browser, operating system, and the LaTeX input when relevant.
- **Request a feature.** Use the feature request form and explain the problem before the proposed solution.
- **Translate.** See [docs/TRANSLATING.md](docs/TRANSLATING.md) and open a translation issue to claim a language.
- **Improve documentation.** Fix unclear instructions, typos, or missing deployment details.
- **Send code.** Bug fixes, accessibility improvements, and well-scoped features are welcome.

For larger changes, open an issue before writing the implementation. It avoids duplicated work and lets us agree on the approach.

## Development setup

Requirements: Node.js `^20.19.0` or `>=22.12.0` and npm.

```bash
git clone https://github.com/mki169/bettermathtype.git
cd bettermathtype
npm install
npm run dev
```

The development server runs at `http://localhost:5173`.

Before opening a pull request:

```bash
npm run build
```

There is no automated test suite yet. Browser verification is the primary check. Test the flow you changed in at least one Chromium-based browser, and check both light and dark themes when the change affects the interface.

## Project conventions

- **Keep it simple.** The app uses vanilla JavaScript and CSS. Do not introduce a UI framework or a new dependency without discussing it first.
- **Preserve the output path.** MathLive produces LaTeX, MathJax renders it with STIX 2, and the SVG is flattened and copied to Word. Changes to rendering should keep preview and export consistent.
- **Keep the Word preview light.** The preview simulates a Word page, so it intentionally stays paper-white in dark mode.
- **Match the existing style.** Follow the formatting, naming, and CSS variable patterns already in the codebase. Avoid unrelated refactors in the same pull request.
- **Respect generated files.** Do not commit `dist/` or `node_modules/`. They are generated and ignored.
- **Never commit secrets.** There are no environment variables in the app, and no credentials belong in the repository.

## Issues

Use the issue templates:

- [Bug report](https://github.com/mki169/bettermathtype/issues/new?template=bug_report.yml)
- [Feature request](https://github.com/mki169/bettermathtype/issues/new?template=feature_request.yml)
- [Translation](https://github.com/mki169/bettermathtype/issues/new?template=translation.yml)

Search existing issues first. Include the smallest equation that reproduces a rendering problem, and mention the output size and preview mode.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Use a descriptive branch name such as `fix/clipboard-fallback`, `feat/display-preview`, or `translation/es-readme`.
3. Keep the change focused. Update documentation when behavior changes.
4. Run `npm run build` and test the affected flow in a browser.
5. Open a pull request and fill in the template. Link related issues with `Closes #12`.
6. Include screenshots or a short recording for visible interface changes.

Write commit messages in the imperative mood, for example:

```text
Fix clipboard fallback on Safari
Add Spanish README translation
```

Small, readable commits are preferred over a single large commit. Do not force-push after review has started unless asked to.

## Automated checks

Every push to `main` and every pull request runs the CI workflow in `.github/workflows/ci.yml`. It:

- installs dependencies with `npm ci`
- checks the JavaScript syntax in `src/`
- builds the production bundle
- smoke-tests the built site and its required static assets

Dependabot opens weekly pull requests for npm and GitHub Actions updates. Let CI validate those changes and keep unrelated edits out of dependency pull requests.

## Translations

Read the full [translation guide](docs/TRANSLATING.md).

- Claim a language by opening a [translation issue](https://github.com/mki169/bettermathtype/issues/new?template=translation.yml).
- README translations use `README.<locale>.md`, for example `README.es.md` or `README.zh-CN.md`.
- Add a language link to both the English README and the translated README once the translation exists.
- The interface is currently English-only. Interface translations need string extraction first, so coordinate that in the translation issue before opening a large pull request.
- Do not translate code, LaTeX, URLs, file paths, CLI commands, or product names such as BetterMathType, MathLive, MathJax, STIX 2, Microsoft Word, and MathType.
- A native speaker should review the translation before it is merged.

## Review and merge

- A maintainer reviews each pull request for correctness, scope, and consistency.
- Address review comments with new commits. Do not rewrite published history.
- Pull requests must pass the production build.
- Translation pull requests should be reviewed by a native speaker when possible.
- The maintainer merges accepted changes into `main`.

## License

By contributing, you agree that your contributions are licensed under the [ISC License](LICENSE).
