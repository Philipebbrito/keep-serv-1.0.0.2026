# Plano: Novo pedido no quadro do garçom

## Objetivo
Adicionar a opção de **iniciar um novo pedido** diretamente do quadro de pedidos (Kanban), visível para o garçom (e também para o gestor, que tem acesso total). Hoje todos os pedidos vêm de dados mock; não existe fluxo de criação.

## Mudanças

### 1. Catálogo de produtos (`src/lib/keepserv/menu.ts` — novo)
Lista estática de produtos do bar/restaurante, agrupados por categoria (`prato`, `entrada`, `bebida`, `sobremesa`), cada um com `name`, `price` e `category`. Serve como "cardápio" que o garçom usa para montar o pedido. Reaproveita o tipo `OrderItem` existente.

### 2. Função `createOrder` no store (`src/lib/keepserv/store.tsx`)
- Adicionar `createOrder(input)` ao contexto: recebe `table`, `guests`, `items[]`, `notes?`, `priority`.
- Gera `code` sequencial (ex.: `#1043`), `id` único, `waiter` = nome do usuário logado, `status: "pendente"`, `openedAt`/`statusChangedAt` = `Date.now()`, `messages: []`.
- Inclui validação mínima: mesa e pelo menos 1 item obrigatórios.
- Exportar `createOrder` no `value` do contexto e na interface `KeepServContext`.

### 3. Botão "Novo pedido" no quadro (`src/routes/pedidos.tsx`)
- Adicionar um botão `Novo pedido` (ícone `Plus`) no cabeçalho, ao lado dos cards de KPI.
- Visível para `garcom` e `gestor` (cozinha não cria pedidos).
- Ao clicar, abre o `NewOrderDialog`.

### 4. Componente `NewOrderDialog` (`src/components/keepserv/new-order-dialog.tsx` — novo)
Modal seguindo o padrão visual do `OrderDialog` existente:
- **Mesa** (input numérico) e **Pessoas** (input numérico).
- **Cardápio**: lista os produtos do `menu.ts` agrupados por categoria; cada produto tem botão `+` para adicionar e controle de quantidade (com nota opcional por item).
- **Resumo do pedido**: itens adicionados, com qty, preço e total calculado; permitir remover item.
- **Observações** gerais (textarea) e toggle de **prioridade**.
- **Confirmar**: chama `createOrder` e fecha o modal; o novo pedido aparece na coluna "Pendente" do Kanban em tempo real.
- Usa componentes shadcn já existentes (`Dialog`, `Button`, `Input`, `ScrollArea`).

## Validação
- Após implementar, abrir o preview como garçom, clicar em "Novo pedido", montar um pedido e confirmar → o card deve aparecer na coluna Pendente com SLA começando a contar.
- Confirmar que gestor também vê o botão e que cozinha não vê.
- Verificar build/typecheck sem erros.
