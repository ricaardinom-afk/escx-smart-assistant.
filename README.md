# ESCX Smart Assistant

Aplicação web da ESCX Procurement Service, desenvolvida directamente no código e mantida no GitHub.

## Tecnologias

- React 19
- TypeScript
- TanStack Start e TanStack Router
- Vite
- Tailwind CSS
- Supabase

## Requisitos

- Bun (versão compatível com o lockfile do projecto)
- Node.js, conforme os requisitos das ferramentas de desenvolvimento

## Desenvolvimento local

```bash
bun install --frozen-lockfile
bun run dev
```

## Verificações

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## Configuração

Criar um ficheiro `.env` com as variáveis necessárias, usando `.env.example` como referência. Nunca publicar chaves secretas nem colocar credenciais privadas em variáveis com prefixo `VITE_`.

A aplicação utiliza o projecto Supabase já configurado. Não executar migrações ou alterar políticas de segurança como parte da configuração de frontend.

## Agendamento e contacto

Os contactos institucionais e os links de agendamento são centralizados em `src/lib/brand.ts`. Os URLs do Calendly devem ser preenchidos apenas depois de os eventos presencial e online estarem configurados.
