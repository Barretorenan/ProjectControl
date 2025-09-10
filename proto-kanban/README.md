# ProtoKanban (Electron + React + Vite)

Aplicativo desktop com duas funcionalidades principais:

- Prototipagem de telas: crie nós (telas), conecte os fluxos, salve/carregue em JSON.
- Gerenciamento de projetos: adicione tickets (nome, descrição, estimativa, datas, status) e organize em um quadro Kanban com arrastar-e-soltar; salve/carregue em JSON.

### Executar em desenvolvimento

```bash
npm install
npm run dev
```

Isso inicia o Vite e abre o Electron apontando para o dev server.

### Build de distribuição

```bash
npm run build
npm run dist
```

Os artefatos serão gerados na pasta `release/` conforme seu sistema operacional.

### Estrutura

- `electron/` – processo principal do Electron (main e preload)
- `src/` – renderer React (Home, Prototype, Kanban)

### Salvamento/Carregamento

Ambas as telas usam o diálogo do sistema operacional para salvar/abrir arquivos `.json` contendo o estado atual.
