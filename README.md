# Vanzak Guard

Bot responsável pela segurança operacional e controle dos canais do Discord.

## Setup

```bash
npm install
cp .env.example .env
```

Preencha o `.env`:

- `DISCORD_TOKEN` — token do bot, gerado no [Discord Developer Portal](https://discord.com/developers/applications)
- `GUILD_ID` — ID do servidor Discord

Ajuste as regras em `config.json` (horários, canal da reunião, cargos ignorados).

## Scripts

```bash
npm run dev      # roda em watch mode (tsx)
npm run build    # compila para dist/
npm start        # roda o build
npm run lint      # eslint
npm run format    # prettier
```

## Estrutura

```
src/
  commands/     # slash commands (fase 3)
  events/       # handlers de eventos do Discord Gateway
  services/     # regras de negócio (fase 2+)
  scheduler/    # jobs agendados (node-cron)
  middlewares/  # checagens de permissão/cargo
  config/       # carregamento de config.json + env
  database/     # SQLite (better-sqlite3)
  utils/        # logger, helpers
  types/        # tipos compartilhados
```

## Deploy

Push na `main` roda o CI (lint + build). Deploy automático configurado como Background Worker no Railway.
