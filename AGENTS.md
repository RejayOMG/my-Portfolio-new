# Project Agent Instructions

## Language Policy

The agent must always reply to the user in Simplified Chinese.

This rule applies to all normal conversation, task explanations, summaries, implementation notes, debugging explanations, and final responses.

Code, variable names, function names, file names, package names, framework names, API names, command names, logs, error messages, and technical terms may remain in English when keeping the original wording is clearer or more accurate.

Do not reply in Japanese unless the user explicitly asks for Japanese.

Do not reply in English unless the user explicitly asks for English.

If the user's message is in Chinese, respond in Simplified Chinese.

If the project files, comments, logs, or documentation contain Japanese or English, do not copy their language style into the conversation response. Explain them in Simplified Chinese.

## Response Style

Keep responses clear, practical, and direct.

When explaining technical issues, prioritize:
1. What happened
2. Why it happened
3. How to fix it
4. What to check next

Avoid overly long explanations unless the user asks for details.

When the user asks for a short answer, keep the response concise.

When the user asks for a document, PRD, prompt, copywriting, or design description, write it in the requested format and language.

## Code and Implementation Rules

Preserve existing project structure unless the task clearly requires changes.

Before modifying files, understand the relevant existing code and dependencies.

Do not rename files, routes, components, variables, or APIs unless necessary.

Do not introduce new dependencies unless they are clearly needed.

Prefer minimal, focused changes over large rewrites.

When editing Nuxt / Vue / TypeScript code:
- Follow the existing coding style in the project.
- Keep component logic readable.
- Avoid unnecessary abstraction.
- Keep TypeScript types clear and practical.
- Do not remove existing functionality unless the user explicitly asks.

## Project Safety Rules

Do not run destructive commands unless the user explicitly approves them.

Destructive commands include but are not limited to:
- rm -rf
- git reset --hard
- git clean -fd
- deleting large folders
- overwriting important configuration files
- changing package manager lock files without reason

Before making risky changes, explain the risk and ask for confirmation.

Do not modify environment files such as `.env`, `.env.local`, or secret configuration files unless the user explicitly asks.

Do not expose API keys, tokens, passwords, or private credentials in responses.

## Debugging Rules

When debugging, first identify the most likely cause based on the error message and project context.

Check related files before making changes.

If multiple causes are possible, list them in priority order.

When suggesting commands, explain what the command is for.

If a fix is uncertain, say so clearly and suggest how to verify it.

## Git and File Change Rules

When modifying files, summarize:
- Which files were changed
- What changed
- Why the change was made
- Whether the user needs to run any command

Do not create unrelated files.

Do not reformat unrelated code.

Do not make broad changes outside the user's requested scope.

## UX / Product / Design Tasks

When the user asks about product design, UX, UI, workflow, PRD, or interaction logic, answer from a product designer perspective.

Prioritize:
- User goal
- Core scenario
- Interaction flow
- Edge cases
- UI clarity
- Implementation feasibility

For design copy, keep wording natural, concise, and product-friendly.

For English UI copy, make it clear, simple, and suitable for overseas users.

## Final Response Requirements

Always use Simplified Chinese for the final response unless the user explicitly requests another language.

Keep English only where it improves technical accuracy, such as:
- `package.json`
- `nuxt.config.ts`
- `components/`
- `useFetch`
- `ref`
- `computed`
- `npm run dev`
- `Provider returned an empty response`

Never switch the whole response to Japanese.