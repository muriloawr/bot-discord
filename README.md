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
- `CLIENT_ID` — ID da aplicação (application ID), usado para registrar os slash commands
- `DATA_DIR` — opcional. Pasta onde o SQLite (`vanzak-guard.sqlite`) é salvo. Em produção (Railway) **precisa** apontar para um Volume persistente (veja seção "Persistência de dados" abaixo). Localmente pode deixar em branco.

Ajuste as regras em `config.json` (horários, canal da reunião, cargos ignorados).

## Scripts

```bash
npm run dev              # roda em watch mode (tsx)
npm run build            # compila para dist/
npm start                # roda o build
npm run lint              # eslint
npm run format            # prettier
npm run deploy-commands   # registra/atualiza os slash commands no servidor (GUILD_ID)
```

Rode `npm run deploy-commands` sempre que adicionar ou alterar um comando em `src/commands/`.

## Estrutura

```
src/
  commands/     # slash commands
  events/       # handlers de eventos do Discord Gateway
  services/     # regras de negócio (fase 2+)
  scheduler/    # jobs agendados (node-cron)
  middlewares/  # checagens de permissão/cargo
  config/       # carregamento de config.json + env
  database/     # SQLite (node:sqlite)
  utils/        # logger, helpers
  types/        # tipos compartilhados
```

## Comando `/puxar`

Move um membro da call em que ele está para a call de quem executou o comando —
sem precisar dar permissão de "Mover Membros" para todo mundo em todas as calls.

Uso: `/puxar membro:@pessoa`

Para funcionar em qualquer call do servidor, o **cargo do bot** precisa ter,
nas configurações do servidor (Cargos → cargo do bot → Permissões), as
permissões:

- `Conectar`
- `Mover Membros`

Isso é uma permissão de cargo (concedida só ao bot), não uma permissão por
canal — então os membros continuam sem poder mover uns aos outros
diretamente, só através do comando.

## Persistência de dados (Railway)

O bot guarda tudo (usuários, violações, ações, tempo em call) num arquivo
SQLite local. Um **Background Worker no Railway sem Volume anexado tem
sistema de arquivos efêmero** — toda vez que sobe um deploy novo, esse
arquivo é recriado vazio e o histórico anterior se perde.

Pra evitar isso:

1. No serviço do bot no Railway: **Settings → Volumes → New Volume**.
2. Defina um **Mount Path**, por exemplo `/data`.
3. Em **Variables**, adicione `DATA_DIR=/data` (o mesmo caminho do mount).
4. Faça um novo deploy.

A partir daí o arquivo `vanzak-guard.sqlite` fica dentro do Volume e
sobrevive aos deploys seguintes.

## Deploy

Push na `main` roda o CI (lint + build). Deploy automático configurado como Background Worker no Railway.
