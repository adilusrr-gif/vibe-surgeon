# Launch kit — public preview

Prepared on 2026-09-27. Text below is **draft copy**, not evidence that a social
post was published. Share only from accounts you control, after reviewing the
copy and the destination's current rules. Do not mass-post or solicit votes.

## Positioning

**Know what to review after your AI edits the repo.**

For developers working on small JS/TS projects who want review hints without
another LLM call. The preview's import graph is incomplete; avoid advertising
universal language support, automatic bug repair or production safety.

## X: compact post

Vibe Surgeon: local review hints after AI edits your repo. Import impact, Git change risk, MCP. No API key. Early preview—not a test runner or security guarantee. Try the reproducible demo:
https://github.com/adilusrr-gif/vibe-surgeon

## LinkedIn: English

An AI-generated patch can look small while touching a file other parts of the app depend on.

Vibe Surgeon is an open-source tool for inspecting that review surface locally: recognizable imports, Git change-risk signals, repository findings and a compact agent handoff. No API key or account is needed.

The included demo changes one file and identifies three potentially affected files. It is intentionally synthetic and reproducible—not a claim that the tool caught a real production bug.

This is an early preview. It does not run your tests, understand every import pattern or guarantee safe changes. The Git comparison now fails explicitly when it cannot determine the diff.

Looking for feedback from developers willing to try it on a public or sanitized JS/TS repository: which warning helped, and which one was misleading?

Source and demo instructions: https://github.com/adilusrr-gif/vibe-surgeon

## LinkedIn / personal Telegram channel: Russian

ИИ поменял один файл. Какие части проекта теперь стоит перепроверить?

Vibe Surgeon — открытый локальный инструмент, который показывает распознанные связи импортов, потенциальную область влияния Git-изменений и замечания по репозиторию. API-ключ не нужен.

В учебном демо меняется один файл, а в цепочке зависимостей оказываются три. Пример воспроизводится командой `npm run demo`.

Это ранняя версия: она не запускает тесты приложения и не гарантирует отсутствие ошибок. Нужна обратная связь на реальных, публичных или обезличенных JS/TS-проектах: полезное предупреждение, ложное срабатывание или пропущенная зависимость.

Код и инструкции: https://github.com/adilusrr-gif/vibe-surgeon

## Demo recording: about 25 seconds of content

1. Show `npm run demo` and its generated fixture warning.
2. Point to one changed file and three potentially impacted files.
3. Open the generated HTML report; label it as the separate health snapshot.
4. End with the repository URL and “Try it. Report one useful warning or one miss.”

Always label the fixture synthetic. Do not splice invented numbers into output.

## Community distribution gate

Start with an owned professional account and one relevant community whose rules
allow project feedback. Ask moderators when promotion rules are unclear. Publish
a distinct technical explanation rather than repeating the same sales pitch.

**Hacker News is deferred, not auto-posted.** Its guidelines prohibit generated
or AI-edited conversation, and Show HN discourages quickly generated one-offs.
The maintainer should first use and understand the tool, then write personally
about a substantive problem and be present to discuss it. This file deliberately
does not provide a copy/paste HN comment or a vote-request campaign.

Official rules checked:
- https://news.ycombinator.com/newsguidelines.html
- https://news.ycombinator.com/showhn.html

## Discoverability settings (owner action)

Suggested About description:
`Local review hints for AI-assisted code: import impact, Git change guard, MCP and SARIF. No API key.`

Suggested topics:
`vibe-coding`, `ai-coding`, `developer-tools`, `static-analysis`, `code-review`,
`javascript`, `typescript`, `mcp`, `sarif`, `cli`, `local-first`.

These are suggestions, not a claim that repository metadata has been updated.
GitHub documents topics as a way to help people find and contribute to projects:
https://docs.github.com/articles/classifying-your-repository-with-topics

## Claims we can and cannot make

Can: local CLI; no LLM API calls; MIT; a reproducible three-file fixture; tested
Git error handling; a preview with explicit limits.

Cannot yet: saved developer hours; prevented production incidents; real-user
retention; percentage accuracy; comprehensive vulnerability detection; 50k stars.

## Publication ledger

GitHub changes and release status must be verified after publishing. Social drafts
are **not sent** until an authorized connected channel confirms a post URL.
A prepared asset is not an audience reached.
