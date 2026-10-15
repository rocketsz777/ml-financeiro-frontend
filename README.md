# Rocket Imports Gestao

Frontend React/Vite do sistema de gestao financeira para marketplaces.

## Modo oficial

Por padrao, o frontend usa a API real configurada em `src/services/api.js`.

```bash
npm run dev
npm run build
```

Para manter o oficial sem dados mockados, nao defina `VITE_USE_MOCK=true` no ambiente de producao.

## Modo demo

O modo demo bloqueia chamadas externas e usa apenas dados ficticios de `src/data/mockData.js`.

Use para apresentacoes, portfolio e LinkedIn:

```bash
npm run dev:demo
npm run build:demo
```

Tambem e possivel ativar o demo em qualquer deploy adicionando `?demo=true` ao final da URL.

Exemplo:

```text
https://seu-site.vercel.app/?demo=true
```

Nesse modo, dashboards, produtos, vendas, integracoes, importacao e relatorios sao simulados localmente.
