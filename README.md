# KeepServ - Gestão Integrada para Bares e Restaurantes

> Aplicação *front-end* para gestão visual de pedidos (Kanban), comunicação entre salão e cozinha, controle de caixa e dashboard de conciliação financeira em bares e restaurantes.

---

## 📋 Sumário
- [Termo de Abertura do Projeto (TAP)](#termo-de-abertura-do-projeto-tap)
- [Documentação Acadêmica (ABNT)](#documentação-acadêmica-abnt)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Interdisciplinaridade](#interdisciplinaridade)
- [Autores e Equipe](#autores-e-equipe)

---

# Termo de Abertura do Projeto (TAP)

**Faculdade CCI**[cite: 1]  
**Curso:** Análise e Desenvolvimento de Sistemas[cite: 1]  
**Data:** 01 de Setembro de 2026[cite: 1]  

### 1. Identificação
* **Nome do Projeto:** KeepServ (Keep Serv)[cite: 1]
* **Grupo Responsável:** Keep Serv[cite: 1]
* **Professor Responsável:** Sosthenes Carlos Ferreira do Nascimento[cite: 1]
* **Equipe do Projeto:** Matheus Henrique, Francisco Tauã, Douglas Sales, Philipe Borges[cite: 1]

### 2. Disciplinas Vinculadas ao Projeto
* Programação para Dispositivos Móveis I[cite: 1]
* Programação II (POO)[cite: 1]
* Tópicos Avançados em Análise e Desenvolvimento de Sistemas[cite: 1]
* Avaliação de Software[cite: 1]
* Introdução à Rede de Computadores[cite: 1]

### 3. Alinhamento Estratégico
O projeto está alinhado ao foco técnico do semestre em desenvolvimento *Front-end* (Web/Mobile), permitindo o aprofundamento em usabilidade, arquitetura de componentes e consumo de dados[cite: 1]. Além disso, atende a uma demanda real do mercado de *food service*, que busca soluções mais ágeis e visuais para a gestão de pedidos em bares e restaurantes[cite: 1].

### 4. Público-Alvo
Donos e gestores de bares e restaurantes de pequeno e médio porte, além dos garçons/atendentes, operadores de caixa e equipe de cozinha desses estabelecimentos[cite: 1].

### 5. Justificativa
Muitos bares e restaurantes ainda enfrentam falhas de comunicação entre salão e cozinha, seja por anotações em papel, comandas verbais ou uso de sistemas que não priorizam a visualização rápida do status dos pedidos[cite: 1]. Essas falhas geram atrasos, erros e insatisfação dos clientes[cite: 1]. Sistemas de mercado como o Saipos já digitalizam parte desse processo, porém concentram a exibição das informações em formato predominantemente textual/listado[cite: 1]. O **KeepServ** se justifica pela proposta de tornar essa comunicação mais visual, ágil e centrada na experiência de quem trabalha sob pressão durante o horário de pico (quadro Kanban, mensagens rápidas, caixa operacional e dashboard de conciliação financeira)[cite: 1].

### 6. Escopo / Objetivos
Desenvolver o *front-end* funcional da aplicação KeepServ, contemplando[cite: 1]:
* Tela de login/seleção de perfil de acesso ("Entrar no turno": Garçom, Cozinha, Gestor e Caixa)[cite: 1];
* Quadro de pedidos Kanban (Pendente → Em preparo → Pronto → Entregue) com alertas visuais por cor e SLA de espera[cite: 1];
* Mensagens rápidas pré-definidas garçom-cozinha por pedido[cite: 1];
* Módulo de Caixa para fechamento de comandas e acompanhamento de recebimentos[cite: 1];
* Dashboard do Gestor com fluxo de caixa, DRE sintético, extrato/livro caixa, sangrias, suprimentos e gráficos de consolidação por meio de pagamento e despesas operacionais[cite: 1];
* Validação por meio de testes de interface com os 4 integrantes do grupo[cite: 1];
* Utilização de dados mockados/API REST simulada para demonstração[cite: 1];
* Alinhamento ao conteúdo estudado nas disciplinas do período[cite: 1];
* Entrega conforme cronograma do semestre letivo[cite: 1].

### 7. Benefícios Esperados
* Redução da comunicação verbal falha entre salão e cozinha[cite: 1].
* Identificação visual rápida de pedidos atrasados por código de cores[cite: 1].
* Padronização das observações enviadas à praça/cozinha via mensagens rápidas[cite: 1].
* Visão consolidada e simplificada da operação para o gestor (livro caixa, resultado líquido e mix de pagamentos)[cite: 1].
* Interface validada e pronta para futura integração com *back-end* real[cite: 1].

### 8. Exclusões (Fora do Escopo)
* Desenvolvimento de *back-end* real e banco de dados persistente[cite: 1].
* Integração com gateways de pagamento em tempo real (Adquirentes/TEF)[cite: 1].
* Emissão de documentos e cupons fiscais (NFC-e / SAT)[cite: 1].
* Gestão complexa de estoque e curva ABC de insumos[cite: 1].
* Publicação do aplicativo nas lojas oficiais (*Google Play Store / Apple App Store*)[cite: 1].

### 9. Restrições
* Prazo limitado ao calendário do semestre letivo[cite: 1].
* Equipe composta por 4 integrantes[cite: 1].
* Foco técnico do semestre restrito ao *Front-end*, sem *back-end* real[cite: 1].
* Apresentação final limitada a 15 minutos, conforme critérios da disciplina[cite: 1].

### 10. Riscos
* Atraso na entrega de alguma *sprint* por indisponibilidade de integrante da equipe[cite: 1].
* Retrabalho decorrente de mudanças no protótipo após o início da programação[cite: 1].
* Dificuldade em simular de forma realista o comportamento de uma API real por meio de *mocks*[cite: 1].
* Necessidade de ajustes de escopo caso os diferenciais propostos se mostrem complexos demais para o tempo disponível[cite: 1].

### 11. Partes Interessadas

| Nome | Atribuições / Responsabilidades |
| :--- | :--- |
| **Francisco Tauã** | Integrante da equipe de desenvolvimento[cite: 1] |
| **Matheus Henrique** | Integrante da equipe de desenvolvimento[cite: 1] |
| **Douglas Sales** | Integrante da equipe de desenvolvimento[cite: 1] |
| **Philipe Borges** | Integrante da equipe de desenvolvimento[cite: 1] |
| **Sosthenes Carlos Ferreira do Nascimento** | Professor responsável / orientador do projeto[cite: 1] |

### 12. Critérios de Aceitação
O *front-end* será considerado aceito quando[cite: 1]:
1. Todas as telas previstas (Login, Kanban de pedidos, Caixa e Dashboard do gestor) estiverem operacionais com dados mockados de demonstração[cite: 1].
2. A navegação entre perfis e seções ocorra sem falhas ou erros de renderização[cite: 1].
3. Os testes de interface confirmem boa usabilidade e clareza nos fluxos operacionais[cite: 1].
4. A documentação final atenda às normas ABNT e critérios formais da disciplina[cite: 1].

---

# Documentação Acadêmica (Modelo ABNT)

**INSTITUIÇÃO:** Faculdade CCI[cite: 1]  
**CURSO:** Análise e Desenvolvimento de Sistemas[cite: 1]  
**AUTORES:** Matheus Henrique, Francisco Tauã, Douglas Sales, Philipe Borges[cite: 1]  
**ORIENTADOR:** Prof. Sosthenes Carlos Ferreira do Nascimento[cite: 1]  
**CIDADE/DATA:** Brasília-DF, 2026[cite: 1]  

## RESUMO
O presente trabalho apresenta o desenvolvimento do **KeepServ**, uma aplicação focada no ecossistema de gestão de pedidos e controle financeiro para bares e restaurantes[cite: 1]. O projeto aborda os gargalos operacionais da comunicação entre salão, cozinha e caixa através de uma interface web/mobile responsiva, moderna e visual[cite: 1]. A solução implementa login multiperfil (Garçom, Cozinha, Gestor e Caixa)[cite: 1], quadro Kanban com controle de SLA e mudança de cor por tempo de espera[cite: 1], mensagens pré-definidas entre garçom e praça de preparo[cite: 1], módulo de caixa com fechamento de comandas e um dashboard financeiro completo (com indicadores de fluxo de caixa, conciliação, livro caixa, sangrias e suprimentos)[cite: 1]. O trabalho consolida os conceitos interdisciplinares do curso de ADS da Faculdade CCI[cite: 1].  
**Palavras-chave:** KeepServ. Gestão de Pedidos. React. Front-end. Kanban. DRE e Caixa[cite: 1].

## 1. INTRODUÇÃO
No setor de gastronomia e *food service*, a velocidade e a precisão do atendimento influenciam diretamente a experiência do cliente e a rentabilidade do negócio. No entanto, sistemas legados frequentemente pecam por apresentar interfaces sobrecarregadas de tabelas textuais e fluxos engessados, dificultando a tomada de decisão em momentos de pico[cite: 1].

O **KeepServ** foi projetado para unificar a comunicação entre salão, cozinha, caixa e gestão sob uma mesma linguagem visual[cite: 1]. Por meio de uma interface intuitiva dividida por papéis de acesso, a plataforma resolve desde o envio ágil de pedidos na mesa até a conciliação financeira do turno pelo gestor[cite: 1].

## 2. OBJETIVOS

### 2.1 Objetivo Geral
Desenvolver a interface *front-end* e a lógica de interação do sistema KeepServ utilizando arquitetura moderna em componentes, dados mockados e foco na usabilidade para o segmento de bares e restaurantes[cite: 1].

### 2.2 Objetivos Específicos
* Construir a tela de autenticação com seleção de perfis de acesso ("Entrar no turno": Garçom, Cozinha, Gestor e Caixa)[cite: 1].
* Implementar o quadro Kanban de acompanhamento de pedidos com indicadores visuais de progresso e SLA[cite: 1].
* Disponibilizar o envio de mensagens rápidas padronizadas entre os garçons e a praça de produção[cite: 1].
* Projetar o módulo de Caixa com indicadores de faturamento por modalidade de pagamento (Dinheiro, Débito, Crédito e Pix) e recebimento de comandas[cite: 1].
* Estruturar o Dashboard do Gestor com resumo de Entradas vs. Saídas, DRE simplificado, controle de sangrias/suprimentos, distribuição de custos operacionais e Extrato de Movimentações (Livro Caixa)[cite: 1].

## 3. METODOLOGIA
A condução do trabalho baseou-se na metodologia ágil com sprints de desenvolvimento orientadas a prototipagem e validação funcional[cite: 1]:
1. **Engenharia de Requisitos:** Mapeamento do fluxo de atendimento desde a escolha do perfil de acesso até o encerramento do caixa e balanço financeiro[cite: 1].
2. **Prototipagem de Alta Fidelidade & UI Design:** Elaboração da identidade visual do KeepServ, utilizando paleta em tons de azul e componentes estruturados para rápida leitura de status[cite: 1].
3. **Desenvolvimento e Componentização:** Implementação em ambiente JavaScript/TypeScript e React com isolamento de responsabilidades por módulos (Autenticação, Pedidos, Caixa e Dashboard)[cite: 1].
4. **Testes de Usabilidade e Revisão ABNT:** Validação interna das telas e elaboração do relatório técnico acadêmico[cite: 1].

## 4. INTERDISCIPLINARIDADE
O desenvolvimento do KeepServ reflete a sinergia entre as disciplinas do semestre letivo[cite: 1]:
* **Programação para Dispositivos Móveis I / Front-end:** Construção das telas responsivas, estado da aplicação e componentes de interface adaptativos[cite: 1].
* **Programação II (POO):** Modelagem orientada a objetos das entidades do sistema (*Order*, *Item*, *Transaction*, *UserRole*)[cite: 1].
* **Tópicos Avançados em ADS:** Aplicação de padrões de usabilidade, arquitetura limpa em *front-end* e gerenciamento de estado global[cite: 1].
* **Avaliação de Software:** Testes de usabilidade, verificação de fluxos de navegação e validação dos critérios de aceitação do TAP[cite: 1].
* **Introdução à Rede de Computadores:** Estruturação da camada de serviços via chamadas e simulação de rotas RESTful[cite: 1].

## 5. ARQUITETURA DE INTERFACE E FUNCIONALIDADES

### 5.1 Autenticação e Perfis de Acesso
Seletor de perfis para atuação individualizada no turno:
* **Garçom:** Envio de pedidos e alerta de pratos prontos.
* **Cozinha:** Fila de produção em formato de cartões operacionais.
* **Gestor:** Métrica global, tempos médios e DRE/Conciliação.
* **Caixa:** Recebimento e fechamento das comandas das mesas.

### 5.2 Módulo de Caixa e Recebimentos
Apresenta o consolidado das vendas por meio de pagamento (Dinheiro, Débito, Crédito e Pix) e cartões operacionais por comanda, indicando mesa, garçom, itens e subtotal pronto para recebimento.

### 5.3 Dashboard Financeiro e Conciliação (Gestor)
Visão completa contendo Resultado Líquido, Dinheiro na Gaveta, Entradas/Saídas, Sangrias, Suprimentos, gráficos de distribuição de custos e o Extrato de Movimentações (Livro Caixa) com filtros.

## 6. CONCLUSÃO
O projeto **KeepServ** demonstrou a eficiência da aplicação de interfaces focadas no usuário para solucionar gargalos históricos no segmento de bares e restaurantes[cite: 1]. Ao conectar a operação de pista (garçom e cozinha) com os controles administrativos (caixa e gestão financeira), a ferramenta assegura agilidade no atendimento e precisão no controle de caixa[cite: 1]. Todos os requisitos previstos no Termo de Abertura do Projeto foram cumpridos com êxito[cite: 1].

---

## REFERÊNCIAS BIBLIOGRÁFICAS
1. PRESSMAN, Roger S.; MAXIM, Bruce R. **Engenharia de Software:** uma abordagem profissional. 8. ed. Porto Alegre: AMGH, 2016.
2. SOMMERVILLE, Ian. **Engenharia de Software.** 10. ed. São Paulo: Pearson Education do Brasil, 2019.
3. SILVA, Maurício Samy. **React Native:** Desenvolvimento de aplicações móveis com JavaScript. 1. ed. São Paulo: Novatec, 2020.