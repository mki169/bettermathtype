# Translating BetterMathType

BetterMathType is used by people who write mathematics in many languages. Translations of the documentation and interface are welcome.

## Current status

| Area | Status |
| --- | --- |
| README | Ready for translations |
| Documentation | Ready for translations |
| Interface strings | English only; string extraction is not implemented yet |

The interface is currently hardcoded in English. Do not open a large interface translation pull request until the strings have been extracted into locale files. Use a translation issue to coordinate that work first.

## Claim a language

1. Open a [translation issue](https://github.com/mki169/bettermathtype/issues/new?template=translation.yml) with the language and locale code.
2. State what you want to translate: README, documentation, interface, or review.
3. Wait for a maintainer to confirm the scope and avoid duplicate work.
4. Open a pull request using the translation section of the pull request template.

Locale codes use [BCP 47](https://www.rfc-editor.org/info/bcp47), for example `es`, `pt-BR`, `fr`, `de`, `ja`, or `zh-CN`.

## Translating the README

1. Copy `README.md` to `README.<locale>.md` in the repository root. For example: `README.es.md` or `README.zh-CN.md`.
2. Translate the prose, headings, and table of contents.
3. Keep all commands, URLs, file paths, badges, screenshots, and product names unchanged.
4. Keep the deploy button link unchanged. It points to the repository, not to the translated page.
5. Update the Contents anchors so they match the translated headings.
6. Add a language navigation line near the top of the English README and the translated README:

```markdown
**Languages:** [English](README.md) | [Español](README.es.md)
```

7. Add the new translation to the Translations section of `README.md`.
8. Open a pull request. A native speaker should review it before merge.

## Translating the interface

Interface translation is a two-step process:

1. **Coordinate string extraction.** Open a translation issue. A maintainer will decide how strings should be moved into locale files.
2. **Translate the locale file.** Once the extraction exists, copy the English locale file, translate the values, and leave the keys unchanged.

Until then, please do not create partial locale files or translate strings directly in `index.html` or `src/main.js`.

When interface translation is available, keep these rules in mind:

- Do not translate code identifiers, LaTeX, CLI commands, URLs, or file paths.
- Keep keyboard shortcuts and platform labels accurate.
- Keep the product names BetterMathType, MathLive, MathJax, STIX 2, Microsoft Word, and MathType unchanged.
- Keep units such as `pt`, `px`, `SVG`, and `PNG` unchanged.
- Translate the meaning of interface actions, not just the words. For example, "Copy for Word" should describe the same action in the target language.
- Use one register consistently. Decide whether the interface uses formal or informal address and apply it everywhere.
- Leave placeholders and interpolation tokens exactly as they are.

## Terminology

| Term | Guidance |
| --- | --- |
| BetterMathType | Keep as-is |
| MathLive, MathJax, STIX 2 | Keep as-is |
| Microsoft Word, Word | Keep as-is |
| MathType | Keep as-is |
| LaTeX | Keep as-is |
| SVG, PNG | Keep as-is |
| pt | Keep as-is |
| Inline / Display | Translate as the preview layout names |
| Copy for Word | Translate the action consistently with the rest of the interface |
| Equation | Translate using the standard term in the target language |
| Workspace | Translate as the editor area label |

## Review checklist

Before merging a translation, confirm that:

- [ ] Commands, URLs, file paths, and code blocks are unchanged.
- [ ] Product names and units are unchanged.
- [ ] The Contents links point to the correct translated headings.
- [ ] The language navigation line exists in both README files.
- [ ] The translation reads naturally to a native speaker.
- [ ] Both light and dark screenshots still make sense with the translated text.

Thanks for helping make BetterMathType more accessible.
