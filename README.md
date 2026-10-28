# Gramless Cookbook

[![Gramless](https://img.shields.io/badge/framework-gramless%20v1.0-blue.svg)](https://github.com/sidwiskers/gramless)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Runtime](https://img.shields.io/badge/runtime-Telegram%20Serverless%20(V8)-orange.svg)](https://tgcloud.ai)

The **Gramless Cookbook** is the official collection of production-grade architectural patterns, recipes, and practical guides for building Telegram bots and Mini Apps using [**Gramless**](https://github.com/sidwiskers/gramless) on **Telegram Serverless (TGCloud)**.

Every recipe in this repository is a complete, self-contained, and runnable project structured specifically for TGCloud's V8 isolate architecture.

---

## Recipe Index

| Recipe | Category | Core Concept | Description |
| :--- | :--- | :--- | :--- |
| [**01. Minimal Bot**](recipes/01-minimal-bot/) | Getting Started | Handler Architecture | Minimal bot setup. Demonstrates shared bot definitions in `tgcloud/lib/bot.js` and single-line handler exports. |
| [**02. Database CRUD**](recipes/02-database-crud/) | State & Data | Transactional Sessions | Task Manager bot backed by Telegram SQLite (`sdk/db`). Features session commit and automatic rollback on error. |
| [**03. Onboarding Wizard**](recipes/03-onboarding-wizard/) | Conversations | Finite State Machine | Multi-step user onboarding flow with validation guards, cancel hooks, and history back navigation (`ctx.fsm.back()`). |
| [**04. Mini App RPC**](recipes/04-mini-app-rpc/) | Mini Apps | Endpoints & Validation | Mini App with static CDN hosting (`public/`), authenticated RPC endpoints, and built-in schema validation (`v`). |
| [**05. Telegram Stars**](recipes/05-telegram-stars/) | Monetization | Two-Phase Payments | Store accepting Telegram Stars (`XTR`). Covers invoices, `pre_checkout_query` verification, and order fulfillment. |
| [**06. Group Moderation**](recipes/06-group-moderation/) | Administration | Composable Filters | Group moderation bot. Anti-spam regex filters, member tracking, and moderation actions (`banSender`, `restrictMember`). |
| [**07. Lab Testing**](recipes/07-lab-testing/) | Quality Assurance | Offline Testkit | Offline bot testing using Gramless Lab and `node:test`. Simulates users, clicks, and session mutations without network requests. |
| [**08. Migration Guide**](recipes/08-migration-guide/) | Reference | Framework Transition | Side-by-side syntax mapping for developers migrating existing codebases from **grammY** or **Telegraf** to Gramless. |

---

## Telegram Serverless Mental Model

Traditional bot frameworks assume a long-running Node.js process managing an active TCP connection or local Express webhook server. 

In **Telegram Serverless (TGCloud)**, the platform manages HTTP, TLS termination, load balancing, and Bot API proxying at the edge. Your code runs inside lightweight V8 isolates:

```text
Incoming Telegram Update (Webhook)
               │
               ▼
   [TGCloud Edge Dispatcher]
               │
    ┌──────────┴──────────┐
    ▼                     ▼
handlers/message.js   handlers/callback_query.js
    │                     │
    └──────────┬──────────┘
               │
               ▼
       [bot.handler()]
               │
         Gramless Router:
         • Route Dispatch
         • Session Staging
         • Filter Guards
               │
               ▼
       Handler Execution
               │
         (On Success)
               ▼
  [Commit SQLite State & Reply]
```

### Key Differences from Traditional Hosting
1. **No Tokens in Code:** The runtime injects the authenticated API proxy automatically via `import { api } from 'sdk'`.
2. **No Polling Loops:** Never call `bot.start()` or `bot.launch()`. Simply export `bot.handler()`.
3. **Atomic State Persistence:** All database queries go through the built-in SQLite engine (`sdk/db`) with zero network latency to an external database.

---

## The "Rules That Bite" Checklist

When developing for TGCloud, keep these five rules in mind to avoid deployment failures:

1. **Relative Imports Require File Extensions:** Always write `import { bot } from './lib/bot.js'`, never `from './lib/bot'`.
2. **Always Await Database Queries:** Query builders in `sdk/db` are asynchronous. Omitting `await` will fail silently or return unexecuted builder objects.
3. **No Foreign Key Declarations:** `PRAGMA foreign_keys` is disabled in TGCloud SQLite. Foreign key declarations (`.references()`) throw errors at startup. Maintain relationships logically in application code.
4. **Answer Callback Queries Promptly:** Always call `await ctx.answer()` inside button handlers to dismiss loading indicators on the user's client.
5. **Schema Deprecations Require `.deprecated()`:** Deleting a table definition from `schema.js` does not drop the table in SQLite. Drops require an explicit `.deprecated('reason')` declaration.

---

## Deployment Quickstart

Install the official TGCloud command-line tool:

```bash
npm install -g @tgcloud/cli
```

Inside any recipe directory:

```bash
# Authenticate your terminal
tgcloud login

# Preview schema migrations and code diffs
tgcloud diff

# Deploy to Telegram Serverless
tgcloud push
```

---

## Testing

Run the automated offline test suite across the cookbook:

```bash
npm test
```

---

## License

MIT © [sidwiskers](https://github.com/sidwiskers)
