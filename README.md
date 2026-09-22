<img width="1568" height="743" alt="image" src="https://github.com/user-attachments/assets/4256396d-194a-4ea7-babe-aad52a5b17d6" />
<img width="1568" height="748" alt="image" src="https://github.com/user-attachments/assets/d6e39eb2-74e8-4986-9e0c-9e8c6cc2f975" />
<img width="1568" height="755" alt="image" src="https://github.com/user-attachments/assets/ba76ce0a-aa13-41c9-84b7-dfea05e093c9" />

# KeepServ 🍽️

> Plataforma web para gestão operacional e financeira de bares e restaurantes: quadro de pedidos em Kanban, controle de mesas, caixa, cardápio digital com QR Code, estoque, contas a pagar/receber, CRM de clientes e gestão de equipe — tudo em uma interface multi-perfil e multi-loja.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)
![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20TanStack%20Start-informational)
![Licença](https://img.shields.io/badge/licença-privado-lightgrey)

---

## 📋 Sumário

- [Visão geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Perfis de acesso](#-perfis-de-acesso)
- [Stack técnica](#-stack-técnica)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Como rodar localmente](#-como-rodar-localmente)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Modelo de dados (domínio)](#-modelo-de-dados-domínio)
- [Persistência de dados](#-persistência-de-dados-mock)
- [Roadmap / fora do escopo atual](#-roadmap--fora-do-escopo-atual)
- [Sobre o projeto acadêmico](#-sobre-o-projeto-acadêmico)

---

## 🧭 Visão geral

Muitos bares e restaurantes de pequeno e médio porte ainda dependem de comandas de papel, avisos verbais e planilhas soltas para coordenar salão, cozinha e caixa. Isso gera atrasos, pedidos perdidos e falta de visibilidade financeira para o gestor.

O **KeepServ** centraliza essa operação em um só lugar, com uma tela pensada para cada função dentro do restaurante — do garçom que só precisa lançar e acompanhar pedidos, até o gestor que precisa enxergar o fluxo de caixa e o desempenho da loja em tempo real.

## ✨ Funcionalidades

### Operação & Salão
- **Quadro de pedidos (Kanban)** — pedidos fluem por `Pendente → Em preparo → Pronto → Entregue → Pago`, com alerta visual e contagem de tempo em atraso por SLA.
- **Gestão de mesas** — mapa de mesas com status (livre, ocupada, reservada, manutenção, avariada) e motivo customizável.
- **Comandas por mesa** — abertura, itens, observações e mensagens rápidas trocadas entre garçom e cozinha por pedido.
- **Cardápio com QR Code** — geração de QR Code por mesa para cardápio digital acessível pelo cliente.
- **Novo pedido / edição de pedido** — inclusão de itens por categoria (prato, entrada, bebida, sobremesa), quantidade e observações, com possibilidade de cancelamento de item.

### Caixa & Pagamentos
- **Caixa & Balcão** — recebimento e fechamento de comandas por mesa.
- **Múltiplas formas de pagamento** — Dinheiro, Débito, Crédito e Pix, com emissão de comprovante/dialog de impressão.

### Cardápio & Estoque
- **Cardápio & Itens** — cadastro de produtos, categorias, preços e fotos.
- **Estoque & Insumos** — controle de insumos vinculados aos itens do cardápio, com alertas de nível.

### Financeiro (Gestor)
- **Painel Geral** — ocupação de mesas, pedidos em atraso, tempo médio de atendimento, faturamento em aberto, gráficos de pedidos por hora, produtos mais vendidos, tempo médio por etapa e fila atual por etapa.
- **Fluxo de Caixa** — entradas, saídas, sangrias e suprimentos em tempo real.
- **Contas a Pagar** — controle de vencimentos e contas em atraso.
- **Extrato / Livro Caixa** — histórico consolidado de movimentações com filtros.

### Clientes & Equipe
- **CRM de Clientes** — cadastro, histórico de consumo e aniversariantes.
- **Minha Equipe** — gestão de colaboradores, cargos operacionais e níveis de acesso.

### Multi-loja (multi-tenant)
- Suporte a múltiplas lojas sob o mesmo sistema, com **código da loja** exigido no login, permitindo isolamento de dados entre estabelecimentos e um nível de acesso `dev` (super admin) para administração das lojas cadastradas.

## 👥 Perfis de acesso

O login (`"Entrar no turno"`) exige código da loja, usuário e senha, e direciona o usuário conforme seu papel:

| Perfil | Nível de acesso | O que faz |
|---|---|---|
| **Garçom** | Colaborador | Envia pedidos, acompanha status e recebe alertas de pratos prontos. |
| **Cozinha** | Colaborador | Visualiza fila de produção em cartões operacionais e atualiza status do pedido. |
| **Caixa** | Colaborador | Recebe e fecha comandas das mesas. |
| **Gestor** | Gestor / Dono da loja | Acesso total aos dados da própria loja: dashboard, financeiro, estoque, cardápio e equipe. |
| **Dev** | Super admin | Acesso exclusivo ao cadastro e gestão de todas as lojas do sistema. |

## 🛠️ Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | [React 19](https://react.dev) + [TanStack Start](https://tanstack.com/start) (SSR, file-based routing) |
| Roteamento | [TanStack Router](https://tanstack.com/router) |
| Dados assíncronos | [TanStack Query](https://tanstack.com/query) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com) |
| Componentes de UI | [shadcn/ui](https://ui.shadcn.com) sobre [Radix UI](https://www.radix-ui.com) |
| Formulários | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Gráficos | [Recharts](https://recharts.org) |
| Ícones | [Lucide React](https://lucide.dev) |
| QR Code | [`qrcode`](https://www.npmjs.com/package/qrcode) |
| Build / Dev server | [Vite](https://vitejs.dev) |
| Linguagem | TypeScript (modo `strict`) |
| Lint / Format | ESLint + Prettier |

> O projeto é gerenciado e sincronizado via [Lovable](https://lovable.dev) (ver `AGENTS.md`) — evite reescrever o histórico git de branches conectadas, pois isso desincroniza o editor do Lovable.

## 📂 Estrutura do projeto

```
src/
├── routes/              # Rotas (file-based routing do TanStack Router)
│   ├── index.tsx         # Login / seleção de loja e perfil
│   ├── pedidos.tsx        # Quadro de pedidos (Kanban)
│   ├── mesa/              # Mapa de mesas e detalhe de mesa
│   ├── comanda/           # Comandas e detalhe de comanda por pedido
│   ├── caixa.tsx          # Caixa & Balcão
│   ├── cardapio.tsx       # Cardápio & Itens / cardápio digital
│   ├── dashboard.tsx       # Painel do gestor (financeiro e operacional)
│   ├── equipe.tsx          # Gestão de equipe
│   ├── cliente.tsx         # Visão do cliente (cardápio digital via QR)
│   └── dev.lojas.tsx        # Administração de lojas (perfil dev)
│
├── domain/               # Regras de negócio e tipos, por domínio
│   ├── orders/             # Pedidos, mesas, status, SLA
│   ├── billing/            # Caixa, pagamentos, fluxo de caixa
│   ├── menu/                # Cardápio e categorias
│   ├── stock/                # Estoque e insumos
│   ├── customers/            # CRM de clientes
│   └── team/                  # Lojas, usuários, papéis e níveis de acesso
│
├── data/
│   ├── mock/               # Dados simulados (seed) por domínio
│   └── repositories/        # Camada de acesso a dados (abstrai a fonte)
│
├── state/                 # Contexts/stores React por domínio (auth, orders, billing...)
├── components/
│   ├── keepserv/            # Componentes específicos do produto (Kanban, Caixa, etc.)
│   └── ui/                   # Componentes de UI reutilizáveis (shadcn/ui)
├── hooks/                  # Hooks compartilhados
├── lib/                     # Utilitários, tratamento de erro, helpers do domínio
├── styles.css               # Estilos globais (Tailwind)
├── router.tsx                # Configuração do TanStack Router
├── server.ts / start.ts       # Entradas de servidor (TanStack Start)
└── routeTree.gen.ts            # Gerado automaticamente — não editar manualmente
```

## 🚀 Como rodar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org) 20+ (ou [Bun](https://bun.sh), já que o projeto tem `bun.lock`)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd keep-serv

# 2. Instalar dependências
npm install
# ou, se preferir Bun:
bun install

# 3. Rodar em modo desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3000` (host `0.0.0.0`, então também acessível por IP local/rede).

### Login de demonstração

O sistema usa dados mockados (`src/data/mock`). Use o código de loja `KEEPSERV01` e um dos usuários seed (ex.: `gestor`, `dev`, `garcom`) definidos em `src/data/mock/team.mock.ts` para entrar.

## 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento (porta 3000) |
| `npm run build` | Gera o build de produção |
| `npm run build:dev` | Gera build em modo desenvolvimento |
| `npm run preview` | Faz preview local do build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run format` | Formata o código com Prettier |

## 🗂️ Modelo de dados (domínio)

O sistema é organizado por domínios de negócio, cada um com `types.ts` (tipos e enums) e `rules.ts` (regras de negócio):

- **Orders** — `OrderStatus` (`pendente | preparo | pronto | entregue | pago`), `UrgencyLevel` (`ontime | warn | late`), itens de pedido, mensagens entre garçom e cozinha, mesas (`DiningTable`) e motivos de indisponibilidade de mesa.
- **Billing** — formas de pagamento (`dinheiro | debito | credito | pix`), fechamento de comanda, fluxo de caixa, sangrias e suprimentos.
- **Menu** — produtos, categorias (`prato | entrada | bebida | sobremesa`) e preços.
- **Stock** — insumos e níveis de estoque vinculados aos itens do cardápio.
- **Customers** — cadastro e histórico de clientes (CRM).
- **Team** — lojas (`Loja`, multi-tenant via `codigo_loja`), contas de usuário (`UserAccount`), papéis operacionais (`Role`: `garcom | cozinha | gestor | caixa`) e níveis de acesso (`NivelAcesso`: `dev | gestor | dono_loja | colaborador`).

## 💾 Persistência de dados (mock)

Esta é uma aplicação **front-end de demonstração**: não há back-end real nem banco de dados. Os dados (lojas, usuários, pedidos, cardápio, etc.) são seedados em `src/data/mock/` e mantidos em memória/`localStorage` do navegador via os *stores* em `src/state/` (chaves prefixadas com `keepserv_`, ex. `keepserv_session_v4`). Isso significa que:
- Os dados persistem entre recarregamentos da página no mesmo navegador;
- Não há sincronização entre dispositivos ou usuários diferentes;
- Limpar o `localStorage` do navegador reseta o sistema para o estado inicial (seed).

## 🧭 Roadmap / fora do escopo atual

O foco atual do projeto é a camada de front-end e experiência de uso. Ficam fora do escopo por ora:

- Back-end real e banco de dados persistente;
- Integração com gateways de pagamento (adquirentes/TEF) em tempo real;
- Emissão de documentos fiscais (NFC-e / SAT);
- Gestão avançada de estoque (curva ABC, previsão de demanda);
- Publicação em lojas de aplicativos (Google Play / App Store).

## 🎓 Sobre o projeto acadêmico

O KeepServ nasceu como projeto interdisciplinar do curso de Análise e Desenvolvimento de Sistemas (Faculdade CCI), integrando as disciplinas de Programação para Dispositivos Móveis I, Programação II (POO), Tópicos Avançados em ADS, Avaliação de Software e Introdução à Rede de Computadores. O Termo de Abertura do Projeto (TAP) e a documentação acadêmica completa, no modelo ABNT, estão disponíveis em [`ACADEMICO.md`](./ACADEMICO.md).

---

<p align="center">Desenvolvido por Francisco Tauã, Matheus Henrique, Douglas Sales e Philipe Borges — Brasília/DF, 2026.</p>
