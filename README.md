# ♻️ EcoColeta

**Aplicação Desktop para Conectar Moradores a Empresas de Coleta Seletiva**

EcoColeta é uma plataforma que conecta moradores que precisam descartar materiais recicláveis com empresas de coleta que realizam o serviço. O projeto conta com versões web (navegador) e desktop (Electron).

---

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
  - [Modo Desenvolvimento (Navegador)](#modo-desenvolvimento-navegador)
  - [Modo Desenvolvimento (Electron + Backend)](#modo-desenvolvimento-electron--backend)
  - [Modo Produção](#modo-produção)
- [Rotas da Aplicação](#-rotas-da-aplicação)
- [Testes](#-testes)
- [Arquitetura](#-arquitetura)
- [API](#-api)
- [Banco de Dados](#-banco-de-dados)
- [Funcionalidades](#-funcionalidades)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🚀 Tecnologias

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| **React** | 18.x | Biblioteca de UI |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Bundler e dev server |
| **Electron** | 33.x | Aplicação desktop |
| **Tailwind CSS** | 3.x | Estilização |
| **React Router** | 7.x | Roteamento SPA |
| **Socket.IO Client** | 4.x | Comunicação em tempo real |
| **Vitest** | 4.x | Testes unitários |
| **Testing Library** | - | Testes de componentes |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| **Node.js** | 26.x | Runtime |
| **Express** | 4.x | Servidor HTTP |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 6.x | ORM e migrations |
| **SQLite** | - | Banco de dados |
| **Socket.IO** | 4.x | WebSockets em tempo real |
| **Zod** | 3.x | Validação de schemas |
| **JWT** | - | Autenticação |
| **bcryptjs** | - | Hash de senhas |
| **Vitest** | 2.x | Testes |
| **Supertest** | - | Testes de API |

---

## 📁 Estrutura do Projeto

```
ecocoleta/
├── src/                          # Frontend (React + Vite)
│   ├── components/               # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── DataTable.tsx
│   │   ├── Header.tsx
│   │   ├── Input.tsx
│   │   ├── Layout.tsx
│   │   ├── MapView.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StarRating.tsx
│   │   ├── StatusBadge.tsx
│   │   └── Timeline.tsx
│   ├── contexts/                 # Contextos React
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                    # Hooks personalizados
│   │   ├── useAuth.ts
│   │   ├── useGoogleMaps.ts
│   │   ├── useNotifications.ts
│   │   ├── useSocket.ts
│   │   └── useTheme.ts
│   ├── pages/                    # Páginas da aplicação
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ManageCompaniesPage.tsx
│   │   │   ├── ManageUsersPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterCompanyPage.tsx
│   │   │   └── RegisterResidentPage.tsx
│   │   ├── company/
│   │   │   ├── CollectionProcessPage.tsx
│   │   │   ├── CompanyDashboard.tsx
│   │   │   ├── MapViewPage.tsx
│   │   │   └── RequestDetailPage.tsx
│   │   └── resident/
│   │       ├── HistoryPage.tsx
│   │       ├── NewRequestPage.tsx
│   │       ├── RequestDetailPage.tsx
│   │       └── ResidentDashboard.tsx
│   ├── services/                 # Serviços (API, Socket)
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── types/                    # Tipos TypeScript
│   ├── App.tsx                   # Componente raiz + rotas
│   ├── main.tsx                  # Entry point
│   └── index.html                # HTML base
│
├── server/                       # Backend (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma         # Schema do banco
│   │   └── seed.ts               # Dados de exemplo
│   └── src/
│       ├── config/               # Configurações
│       ├── middleware/            # Middlewares (auth, error, validate)
│       ├── modules/              # Módulos (admin, auth, companies, etc.)
│       ├── routes/               # Rotas da API
│       ├── services/             # Serviços (Socket.IO)
│       ├── app.ts                # App Express
│       └── server.ts             # Entry point do servidor
│
├── electron/                     # Configuração Electron
│   ├── main.ts
│   └── preload.ts
│
├── tests/                        # Testes frontend
├── vite.config.ts                # Configuração Vite (navegador)
├── electron.vite.config.ts       # Configuração Vite (Electron)
├── vitest.config.ts              # Configuração de testes
├── tailwind.config.js
└── package.json
```

---

## 📦 Pré-requisitos

- **Node.js** >= 18.x (recomendado 20.x ou superior)
- **npm** >= 9.x
- **Git** (opcional, para clonar)

---

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/ecocoleta.git
   cd ecocoleta
   ```

2. **Instale as dependências**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure as variáveis de ambiente** (já existe `.env` padrão em `server/.env`)
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="sua-chave-secreta-aqui"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:5173"
   
   > **Nota**: O arquivo `server/.env` já existe com valores padrão funcionais para desenvolvimento.
   ```

4. **Prepare o banco de dados**
   ```bash
   cd server
   npx prisma db push      # Cria as tabelas
   npx tsx prisma/seed.ts   # Popula com dados de exemplo
   cd ..
   ```

---

## 🎮 Como Usar

### Modo Desenvolvimento (Navegador)

Inicia apenas o frontend React no navegador + backend:

```bash
# Terminal 1: Backend
cd server && npx tsx src/server.ts

# Terminal 2: Frontend (navegador)
npx vite
```

Acesse: **http://localhost:5173**

O arquivo `vite.config.ts` já configura proxy automático para o backend na porta 3001, então não há problemas de CORS.

### Modo Desenvolvimento (Electron + Backend)

Inicia backend + Electron (requer interface gráfica):

```bash
# Usando concurrently (inicia backend + Electron)
npm run dev

# Ou manualmente:
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Electron + Frontend (requer interface gráfica)
npm run dev:electron

# Apenas o frontend no navegador (sem Electron)
npm run dev:client
```

> **⚠️ Nota**: `npm run dev` e `npm run dev:electron` tentam abrir a janela do Electron e requerem um ambiente com interface gráfica. Para testar apenas no navegador, use `npx vite` (após iniciar o backend em outro terminal).

### Modo Produção

```bash
# Build completo
npm run build

# Iniciar servidor
cd server && node dist/server.js
```

---

## 🗺️ Rotas da Aplicação

### Páginas Públicas (sem autenticação)
| Rota | Descrição |
|---|---|
| `/login` | Tela de login |
| `/register/resident` | Cadastro de morador |
| `/register/company` | Cadastro de empresa |

### Páginas Compartilhadas (todos os usuários logados)
| Rota | Descrição |
|---|---|
| `/` | Dashboard padrão (exibe dashboard de morador para todos) |

### Páginas do Morador
| Rota | Descrição |
|---|---|
| `/requests/new` | Criar nova solicitação de coleta |
| `/requests/:id` | Detalhes da solicitação |
| `/history` | Histórico de todas as solicitações |
| `/ranking` | Pontuação e rankings |

### Páginas da Empresa
| Rota | Descrição |
|---|---|
| `/map` | Mapa com solicitações pendentes |
| `/company/requests` | Lista de solicitações recebidas |
| `/company/requests/:id` | Detalhes da solicitação |
| `/company/collection` | Processo de coleta (aceitar, rota, concluir) |

### Páginas de Administrador
| Rota | Descrição |
|---|---|
| `/admin/users` | Gerenciar usuários (ativar/desativar) |
| `/admin/companies` | Gerenciar empresas (aprovar/rejeitar) |
| `/admin/reports` | Relatórios mensais |

---

## 🧪 Testes

### Backend (288 testes)
```bash
cd server && npx vitest run
```

### Frontend (494 testes)
```bash
npx vitest run
```

### Testes em modo watch
```bash
# Backend
cd server && npm run test:watch

# Frontend
npx vitest
```

### Cobertura de testes
- ✅ Autenticação (login, registro, JWT)
- ✅ CRUD de solicitações de coleta
- ✅ Avaliações e notificações
- ✅ Painel administrativo
- ✅ Componentes React (Button, Card, DataTable, etc.)
- ✅ Hooks personalizados
- ✅ Contextos (Auth, Theme)
- ✅ Integração com Socket.IO
- ✅ Validação de schemas (Zod)
- ✅ Middleware de autenticação e erro
- ✅ Rotas e permissões por papel (role-based access)

---

## 🏗️ Arquitetura

### Fluxo de Dados

```
[Browser / Electron] ←→ [Vite Dev Server (5173)]
       │                         │ proxy
       │                    [Express API (3001)]
       │                         │
       │                    [Prisma ORM]
       │                         │
       │                    [SQLite DB]
       │
       └── [Socket.IO Client] ←→ [Socket.IO Server]
```

### Papéis de Usuário (Role-based Access)

- **Resident** (Morador): Cria solicitações de coleta, visualiza histórico, avalia empresas
- **Company** (Empresa): Visualiza solicitações pendentes no mapa, aceita coleta, gerencia processo
- **Admin** (Administrador): Gerencia usuários, empresas, visualiza relatórios

### Comunicação em Tempo Real (Socket.IO)

- `request:new` - Notifica empresas sobre novas solicitações
- `request:status_changed` - Atualiza status da solicitação em tempo real
- `notification:new` - Envia notificações para usuários/empresas

---

## 📡 API

A API roda em `http://localhost:3001/api`.

### Endpoints Principais

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/register/resident` | Cadastro morador |
| `POST` | `/auth/register/company` | Cadastro empresa |
| `GET` | `/users/me` | Dados do usuário logado |
| `GET` | `/requests` | Listar solicitações |
| `POST` | `/requests` | Criar solicitação |
| `PUT` | `/requests/:id/status` | Atualizar status |
| `GET` | `/companies` | Listar empresas |
| `POST` | `/reviews` | Criar avaliação |
| `GET` | `/notifications` | Listar notificações |
| `GET` | `/admin/stats` | Estatísticas (admin) |
| `GET` | `/admin/users` | Listar usuários (admin) |
| `GET` | `/admin/companies` | Listar empresas (admin) |

---

## 🗄️ Banco de Dados

O projeto usa **SQLite** via Prisma ORM. O arquivo do banco fica em `server/prisma/dev.db`.

### Modelos

- **User** - Moradores e administradores
- **Company** - Empresas de coleta
- **CollectionRequest** - Solicitações de coleta
- **Material** - Tipos de materiais recicláveis
- **Review** - Avaliações de empresas
- **Notification** - Notificações do sistema
- **Address** - Endereços

### Comandos Prisma

```bash
cd server

# Visualizar banco no navegador
npx prisma studio

# Criar migration após alterar schema
npx prisma db push

# Regenerar cliente Prisma
npx prisma generate

# Popular com dados de exemplo
npx tsx prisma/seed.ts
```

---

## ✨ Funcionalidades

### Para Moradores 🏠
- 👤 Cadastro e autenticação
- ➡️ Solicitar coleta de materiais recicláveis
- 📍 Informar endereço e coordenadas
- 📊 Dashboard com estatísticas (total, concluídas, pontos)
- 📜 Histórico completo de solicitações
- ⭐ Avaliar empresas após coleta
- 🔔 Notificações em tempo real

### Para Empresas 🏢
- 👤 Cadastro e aprovação administrativa
- 🗺️ Mapa com solicitações pendentes
- ✅ Aceitar solicitações de coleta
- 🚛 Processo completo (aceitar → a caminho → concluir)
- 📋 Detalhes das solicitações
- 📊 Dashboard com métricas
- 🔔 Notificações de novas solicitações

### Para Administradores 👑
- 👥 Gerenciar usuários (ativar/desativar)
- 🏢 Aprovar/rejeitar empresas
- 📊 Relatórios mensais com gráficos
- 📈 Estatísticas da plataforma

### Gerais 🌐
- 🌙 Tema claro/escuro
- 📱 Design responsivo
- ⚡ Comunicação em tempo real (Socket.IO)
- 🎨 Interface moderna com Tailwind CSS
- 🖥️ Aplicação desktop (Electron)

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Faça push para a branch (`git push origin feat/nova-feature`)
5. Abra um Pull Request

### Padrões de Commit
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `test:` - Adição ou alteração de testes
- `docs:` - Documentação
- `refactor:` - Refatoração
- `style:` - Formatação de código
- `chore:` - Tarefas de manutenção

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

<div align="center">
  <p>Feito com ♻️ para um mundo mais sustentável</p>
</div>
