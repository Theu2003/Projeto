# Especificação do EcoColeta

## Visão Geral

EcoColeta é um aplicativo desktop que conecta moradores com empresas de coleta seletiva para reciclagem. O sistema permite que moradores solicitem coletas de materiais recicláveis, que empresas aceitem e realizem as coletas, e que administradores gerenciem o整个 plataforma.

## Stack Tecnológico

- **Frontend**: Electron + React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção) via Prisma ORM
- **Tempo Real**: Socket.IO
- **Geolocalização**: Google Maps API
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: Zod
- **Estilo**: Tailwind CSS com modo dark/light
- **Idioma**: Português (Brasil)

## Papéis de Usuário

### 1. Morador (Resident)
- Cria solicitações de coleta
- Visualiza histórico de coletas
- Avalia empresas após coleta
- Acompanha pontos e ranking
- Gerencia perfil e endereços

### 2. Empresa (Company)
- Visualiza solicitações pendentes na região
- Aceita/recusa solicitações
- Atualiza status da coleta (a caminho, concluída)
- Visualiza mapa com solicitações próximas
- Gerencia perfil e área de atendimento

### 3. Administrador (Admin)
- Aprova/bloqueia empresas
- Bloqueia usuários
- Visualiza estatísticas gerais
- Gera relatórios (PDF/Excel)
- Gerencia materiais e configurações

## Schema do Banco de Dados

### Tabelas

#### users
- `id`: UUID (primary key)
- `name`: String (obrigatório)
- `cpf`: String (único, obrigatório)
- `phone`: String (obrigatório)
- `email`: String (único, obrigatório)
- `passwordHash`: String (obrigatório)
- `role`: Enum (resident, admin)
- `address`: String (opcional)
- `latitude`: Float (opcional)
- `longitude`: Float (opcional)
- `points`: Integer (padrão: 0)
- `active`: Boolean (padrão: true)
- `createdAt`: DateTime

#### companies
- `id`: UUID (primary key)
- `name`: String (obrigatório)
- `cnpj`: String (único, obrigatório)
- `responsible`: String (obrigatório)
- `phone`: String (obrigatório)
- `email`: String (único, obrigatório)
- `passwordHash`: String (obrigatório)
- `address`: String (obrigatório)
- `latitude`: Float (obrigatório)
- `longitude`: Float (obrigatório)
- `serviceAreaRadius`: Float (obrigatório, em km)
- `materials`: JSON (array de IDs de materiais)
- `approved`: Boolean (padrão: false)
- `active`: Boolean (padrão: true)
- `rating`: Float (média de avaliações)
- `createdAt`: DateTime

#### collection_requests
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → users)
- `companyId`: UUID (foreign key → companies, opcional)
- `status`: Enum (pending, accepted, on_the_way, completed, cancelled, rescheduled)
- `materialType`: String (obrigatório)
- `quantityKg`: Float (obrigatório)
- `observations`: String (opcional)
- `photos`: JSON (array de URLs)
- `desiredDate`: DateTime (obrigatório)
- `desiredTime`: String (obrigatório)
- `latitude`: Float (obrigatório)
- `longitude`: Float (obrigatório)
- `address`: String (obrigatório)
- `realWeight`: Float (opcional, preenchido na conclusão)
- `completedAt`: DateTime (opcional)
- `createdAt`: DateTime

#### materials
- `id`: UUID (primary key)
- `name`: String (obrigatório)
- `icon`: String (obrigatório)
- `category`: String (obrigatório)
- `recyclable`: Boolean (padrão: true)
- `pointsPerKg`: Float (obrigatório)

#### reviews
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → users)
- `companyId`: UUID (foreign key → companies)
- `requestId`: UUID (foreign key → collection_requests, único)
- `rating`: Integer (1-5, obrigatório)
- `comment`: String (opcional)
- `createdAt`: DateTime

#### notifications
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → users, opcional)
- `companyId`: UUID (foreign key → companies, opcional)
- `type`: String (obrigatório)
- `message`: String (obrigatório)
- `read`: Boolean (padrão: false)
- `data`: JSON (opcional)
- `createdAt`: DateTime

#### addresses
- `id`: UUID (primary key)
- `userId`: UUID (foreign key → users, opcional)
- `companyId`: UUID (foreign key → companies, opcional)
- `label`: String (obrigatório)
- `street`: String (obrigatório)
- `number`: String (obrigatório)
- `neighborhood`: String (obrigatório)
- `city`: String (obrigatório)
- `state`: String (obrigatório)
- `zipCode`: String (obrigatório)
- `latitude`: Float (obrigatório)
- `longitude`: Float (obrigatório)
- `isDefault`: Boolean (padrão: false)

### Relacionamentos

- User 1:N CollectionRequest (solicitou)
- Company 1:N CollectionRequest (coletou)
- User 1:N Review
- Company 1:N Review
- CollectionRequest 1:1 Review
- User/Company 1:N Notification
- User/Company 1:N Address

## API Backend

### Autenticação
- `POST /api/auth/register/resident` — Cadastro morador
- `POST /api/auth/register/company` — Cadastro empresa (requer aprovação admin)
- `POST /api/auth/login` — Login (retorna JWT)
- `POST /api/auth/refresh` — Renovar token

### Usuários (Morador)
- `GET /api/users/me` — Perfil do usuário logado
- `PUT /api/users/me` — Atualizar perfil
- `GET /api/users/dashboard` — Estatísticas do morador
- `GET /api/users/points` — Sistema de pontos e ranking

### Empresas
- `GET /api/companies/me` — Perfil da empresa logada
- `PUT /api/companies/me` — Atualizar perfil
- `GET /api/companies/dashboard` — Estatísticas da empresa
- `GET /api/companies/nearby?lat=&lng=&radius=` — Empresas próximas

### Solicitações de Coleta
- `POST /api/requests` — Criar solicitação (morador)
- `GET /api/requests` — Listar (filtrado por role)
- `GET /api/requests/:id` — Detalhes da solicitação
- `PUT /api/requests/:id/accept` — Aceitar (empresa)
- `PUT /api/requests/:id/reject` — Recusar (empresa)
- `PUT /api/requests/:id/on-the-way` — A caminho (empresa)
- `PUT /api/requests/:id/complete` — Concluir (empresa)
- `PUT /api/requests/:id/cancel` — Cancelar
- `PUT /api/requests/:id/reschedule` — Reagendar

### Avaliações
- `POST /api/reviews` — Criar avaliação (após coleta concluída)
- `GET /api/reviews/company/:companyId` — Avaliações de uma empresa

### Notificações
- `GET /api/notifications` — Listar notificações do usuário
- `PUT /api/notifications/:id/read` — Marcar como lida

### Admin
- `GET /api/admin/users` — Listar todos os usuários
- `GET /api/admin/companies` — Listar todas as empresas
- `PUT /api/admin/companies/:id/approve` — Aprovar empresa
- `PUT /api/admin/users/:id/block` — Bloquear usuário
- `PUT /api/admin/companies/:id/block` — Bloquear empresa
- `GET /api/admin/stats` — Estatísticas gerais
- `GET /api/admin/reports/pdf` — Relatório PDF
- `GET /api/admin/reports/excel` — Relatório Excel

## Eventos Socket.IO

| Evento | Direção | Payload |
|--------|---------|---------|
| `notification:new` | Server→Client | Objeto notificação |
| `request:status_changed` | Server→Client | requestId, status |
| `request:new` | Server→Company | Resumo da solicitação |
| `location:update` | Company→Server | lat, lng, requestId |

## Frontend

### Tema
- Tailwind CSS com modo dark (`dark:` classes)
- Toggle claro/escuro no header
- Paleta: verde (#22C55E) como primária, neutros para fundo
- Animações: framer-motion para transições de página

### Páginas

#### Autenticação
- `LoginPage.tsx` — Login com email/senha, toggle morador/empresa
- `RegisterResidentPage.tsx` — Cadastro morador com autocomplete de endereço
- `RegisterCompanyPage.tsx` — Cadastro empresa

#### Morador
- `ResidentDashboard.tsx` — Cards: solicitações, últimas coletas, pontos, status
- `NewRequestPage.tsx` — Formulário: material, quantidade, fotos, data/hora, mapa
- `RequestDetailPage.tsx` — Status da solicitação, timeline, avaliação
- `HistoryPage.tsx` — Histórico com filtros (data, material, status)
- `RankingPage.tsx` — Top recicladores

#### Empresa
- `CompanyDashboard.tsx` — Pendentes, do dia, total coletado, avaliação
- `MapViewPage.tsx` — Mapa interativo com solicitações, rotas
- `RequestDetailPage.tsx` — Detalhes do cliente, aceitar/recusar/reagendar
- `CollectionProcessPage.tsx` — Fluxo: aceitar → a caminho → concluir

#### Admin
- `AdminDashboard.tsx` — Métricas, gráficos
- `ManageUsersPage.tsx` — CRUD usuários, bloquear
- `ManageCompaniesPage.tsx` — CRUD empresas, aprovar/bloquear
- `ReportsPage.tsx` — Relatórios PDF/Excel
- `StatsPage.tsx` — Estatísticas com gráficos (recharts)

### Componentes Reutilizáveis
- `Button`, `Input`, `Card`, `Modal`, `Badge`, `Avatar`
- `DataTable` — Tabela com paginação, ordenação, filtros
- `MapView` — Wrapper do Google Maps
- `StatusBadge` — Badge colorido por status
- `Timeline` — Timeline de progresso da solicitação
- `StarRating` — Componente de avaliação
- `NotificationBell` — sino com contador
- `ThemeProvider` — Context para tema claro/escuro
- `Sidebar` — Navegação lateral por role

### Hooks Principais
- `useAuth` — Login/logout, info do usuário
- `useSocket` — Conexão Socket.IO
- `useTheme` — Toggle tema
- `useRequests` — CRUD solicitações
- `useGoogleMaps` — Geolocation, directions

## Integração Google Maps

- **Captura de localização**: `navigator.geolocation` + reverse geocoding
- **Autocomplete de endereço**: Google Places Autocomplete
- **Mapa de solicitações**: MarkerCluster para empresa
- **Rota**: Directions Service (empresa → cliente)
- **Distância/duração**: Distance Matrix Service
- **Mapa em tempo real**: Atualização de posição da equipe

## Sistema de Pontos

- Cada kg de material = X pontos (configurable por tipo de material)
- Ranking mensal/top all-time
- Badge conquistas (opcional para MVP)

## Relatórios

- **PDF**: pdfmake (client-side) ou puppeteer (server-side)
- **Excel**: exceljs
- **Gráficos**: recharts

## Validação e Erros

- Validação com Zod em todas as entradas
- Middleware de erro normalizado
- Mensagens de erro em português

## Upload de Fotos

- Multer para upload de fotos de solicitações
- Armazenamento local (uploads/) ou futuro S3
- Limites: tamanho máximo, formatos permitidos

## Notificações

- Push notifications via Socket.IO
- Armazenamento no banco de dados
- Marcar como lida

## Segurança

- Senhas com bcrypt (salt rounds: 12)
- JWT com expiração (access: 15min, refresh: 7d)
- Rate limiting em endpoints públicos
- Validação de entrada em todas as rotas
- CORS configurado para Electron

## Testes (MVP Mínimo)

- Vitest para testes unitários do backend (services/repositories)
- Testes de componente para fluxos críticos do frontend
- Playwright para E2E (fase 9, opcional)

## Distribuição

- electron-builder para empacotamento
- Configuração para Windows, macOS, Linux
- Auto-update (futuro)

## Idioma

- Interface em Português (Brasil)
- Mensagens de erro em português
- Documentação técnica em inglês (código) / português (comentários)