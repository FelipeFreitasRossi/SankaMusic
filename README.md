# Sanka Music — E-commerce de instrumentos musicais

Loja virtual completa para a **Sanka Music**: vitrine, catálogo com filtros, página de produto, carrinho persistente, favoritos, checkout em 6 etapas, área do cliente, painel administrativo e API segura.

> ⚠️ **Dados de demonstração.** Todos os produtos, marcas (Vértice, Ressonar, Cadência, Orbe, Pulso, Lumen, Atlas Audio, Nordsom), preços, estoques e imagens cadastrados pelo script de *seed* são **fictícios** e servem apenas para demonstrar a loja. Eles ficam marcados com `is_demo: true`, exibem o aviso “Produto fictício de demonstração” e podem ser removidos com um comando (veja [Dados de demonstração](#dados-de-demonstração)).

---

## Sumário

1. [Tecnologias](#tecnologias)
2. [Estrutura de diretórios](#estrutura-de-diretórios)
3. [Pré-requisitos](#pré-requisitos)
4. [Configurar o MongoDB Atlas](#configurar-o-mongodb-atlas)
5. [Instalar e executar o backend](#instalar-e-executar-o-backend)
6. [Instalar e executar o frontend](#instalar-e-executar-o-frontend)
7. [Variáveis de ambiente](#variáveis-de-ambiente)
8. [Funcionalidades](#funcionalidades)
9. [Endpoints principais da API](#endpoints-principais-da-api)
10. [Modelagem do MongoDB](#modelagem-do-mongodb)
11. [Segurança](#segurança)
12. [Integrações que dependem de credenciais](#integrações-que-dependem-de-credenciais)
13. [Build de produção](#build-de-produção)
14. [Publicação na HostGator](#publicação-na-hostgator)
15. [Alternativa: VPS Linux](#alternativa-vps-linux)
16. [Testes](#testes)
17. [Dados de demonstração](#dados-de-demonstração)

---

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, CSS Modules, Lucide React, Context API |
| Backend | Python 3.10+, FastAPI, Pydantic v2, PyMongo, PyJWT, bcrypt, a2wsgi (Passenger) |
| Banco | MongoDB Atlas (coleções organizadas e índices) |
| Pagamentos | Mercado Pago (Checkout Pro) — estrutura pronta, requer credenciais |

Sem Docker, Redis, filas ou microsserviços. Dependências leves e pool de conexões pequeno para hospedagem compartilhada.

## Estrutura de diretórios

```text
SankaMusic/
├── frontend/                  # React + Vite (gera arquivos estáticos em dist/)
│   ├── public/                # favicon, .htaccess (SPA), logotipo e ilustrações demo
│   │   ├── brand/             # logotipo provisório (SVG)
│   │   └── demo/              # ilustrações fictícias de produtos/categorias/banners
│   └── src/
│       ├── assets/            # (reservado para imagens importadas pelo código)
│       ├── components/        # ui/, layout/, product/, home/, cart/, address/, order/, brand/
│       ├── contexts/          # Auth, Cart, Favorites, Store (config), Toast
│       ├── hooks/             # useAsync, useDebounce, useDocumentTitle...
│       ├── layouts/           # StoreLayout, AccountLayout, Guards (rotas protegidas)
│       ├── pages/             # loja, auth/, account/, checkout/, admin/
│       ├── services/          # cliente HTTP e serviços por domínio
│       ├── styles/            # tokens (paleta, tipografia) e estilos globais
│       ├── types/             # tipos TypeScript (espelham a API)
│       └── utils/             # formatação, máscaras, constantes, dados da loja
├── backend/
│   ├── app/
│   │   ├── api/               # rotas: auth, catalog, account, orders, admin + deps de autenticação
│   │   ├── core/              # config, banco/índices, segurança (JWT/bcrypt), erros, rate limit, logs
│   │   ├── models/            # nomes das coleções, enums e regras de status
│   │   ├── repositories/      # acesso ao MongoDB
│   │   ├── schemas/           # validação Pydantic (entrada/saída)
│   │   ├── services/          # regras de negócio (preços, pedidos, pagamentos, frete, e-mail, uploads)
│   │   └── utils/
│   ├── scripts/               # seed (dados demo), create_admin, gerador de ilustrações
│   ├── tests/                 # pytest (unidade + integração com mongomock)
│   ├── passenger_wsgi.py      # entrada para cPanel/Passenger (HostGator)
│   ├── run.py                 # execução local
│   ├── requirements.txt
│   └── .env.example
├── deploy/                    # exemplos nginx + systemd (VPS)
└── README.md
```

## Pré-requisitos

- **Python 3.10 ou superior** — <https://www.python.org/downloads/> (no Windows, marque “Add python.exe to PATH”)
- **Node.js 20 LTS ou superior** — <https://nodejs.org/>
- Conta gratuita no **MongoDB Atlas** — <https://www.mongodb.com/atlas>

## Configurar o MongoDB Atlas

1. Crie um **Cluster** (o plano gratuito M0 serve para testes).
2. Em **Database Access**, crie um usuário com senha forte (permissão *readWrite*).
3. Em **Network Access**, libere o IP do seu computador e, em produção, o IP do servidor. (Evite `0.0.0.0/0` em produção.)
4. Em **Database → Connect → Drivers**, copie a *connection string* `mongodb+srv://...` e cole em `MONGODB_URI` no arquivo `backend/.env`.
5. Os índices são criados automaticamente quando a API inicia (ou ao rodar o seed).

## Instalar e executar o backend

### Windows (CMD)

```bat
cd C:\Users\User\Desktop\SankaMusic\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
notepad .env
```

Preencha `MONGODB_URI` e `JWT_SECRET` no `.env`. Para gerar um segredo:

```bat
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Popule o banco com os dados de demonstração e crie o administrador:

```bat
python -m scripts.seed
python -m scripts.create_admin --email seu-email@dominio.com --name "Seu Nome"
```

Inicie a API:

```bat
python run.py
```

### macOS / Linux (Terminal)

```bash
cd ~/Desktop/SankaMusic/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edite o arquivo e preencha MONGODB_URI e JWT_SECRET
python -m scripts.seed
python -m scripts.create_admin --email seu-email@dominio.com --name "Seu Nome"
python run.py
```

A API sobe em <http://127.0.0.1:8000>. Documentação Swagger: **<http://127.0.0.1:8000/api/docs>** · Saúde: <http://127.0.0.1:8000/api/health>

## Instalar e executar o frontend

Em **outro** terminal:

```bat
cd C:\Users\User\Desktop\SankaMusic\frontend
copy .env.example .env
npm install
npm run dev
```

(macOS/Linux: `cd ~/Desktop/SankaMusic/frontend && cp .env.example .env && npm install && npm run dev`)

Acesse **<http://localhost:5173>**. Em desenvolvimento, o Vite encaminha `/api` para `http://127.0.0.1:8000` (proxy), então não há problema de CORS.

- Loja: `http://localhost:5173`
- Painel administrativo: `http://localhost:5173/admin` (entre com o usuário criado pelo `create_admin`)

## Variáveis de ambiente

### `backend/.env`

| Variável | Descrição |
|---|---|
| `APP_ENV` | `development` ou `production` (em produção a API recusa `JWT_SECRET` fraco e `DEBUG=true`) |
| `MONGODB_URI` / `MONGODB_DB` | conexão com o Atlas e nome do banco |
| `JWT_SECRET`, `ACCESS_TOKEN_EXPIRE_MINUTES` | assinatura e validade do token |
| `CORS_ORIGINS` | origens do frontend separadas por vírgula (ex.: `https://seudominio.com.br`) |
| `FRONTEND_URL` | usado nos links de e-mail e no retorno do pagamento |
| `API_PUBLIC_URL`, `API_PREFIX` | URL pública da API (webhook) e prefixo das rotas (padrão `/api`) |
| `STORAGE_BACKEND`, `UPLOAD_DIR`, `MEDIA_BASE_URL`, `MAX_UPLOAD_MB` | uploads de imagens |
| `MAX_INSTALLMENTS`, `MIN_INSTALLMENT_VALUE`, `FREE_SHIPPING_THRESHOLD`, `LOW_STOCK_THRESHOLD` | **regras comerciais — configure com os valores reais da loja** |
| `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` | pagamentos (opcional) |
| `SMTP_*` | envio de e-mails (opcional) |

### `frontend/.env`

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | `/api` em dev; em produção, a URL completa da API (ex.: `https://api.seudominio.com.br/api`) |
| `VITE_BASE_PATH` | `/` na raiz do domínio, ou `/loja/` se publicar em subpasta |
| `VITE_DEMO_MODE` | `true` exibe a faixa “Ambiente de demonstração” |

> Nada que começa com `VITE_` é secreto — vai para o navegador. **Nunca** coloque tokens do Mercado Pago ou o `JWT_SECRET` no frontend.

Os dados institucionais (razão social, CNPJ, telefone, redes sociais) e os textos das páginas “Sobre”, “Trocas”, “Privacidade” e “Termos” ficam em `frontend/src/utils/store.ts`. Campos vazios não aparecem no site — **preencha com as informações oficiais antes de publicar**.

## Funcionalidades

**Loja**
- Header com busca com sugestões instantâneas, conta, favoritos e carrinho com contador; menu de departamentos (mega menu).
- Página inicial: banner rotativo, benefícios, destaques, categorias, ofertas, mais vendidos, novidades, marcas e newsletter.
- Catálogo por categoria, busca e ofertas, com filtros (categoria, marca, faixa de preço, disponibilidade, avaliação, em oferta), ordenação (relevância, menor/maior preço, novidades, mais vendidos, avaliação), paginação e filtros sincronizados na URL.
- Produto: galeria com zoom, preço/promoção/desconto, parcelamento (configurável), estoque, cálculo de frete por CEP, descrição, especificações, avaliações (somente de quem comprou) e relacionados.
- Carrinho persistente (sobrevive ao recarregar), mini carrinho lateral, quantidades limitadas ao estoque, preços sempre conferidos pelo servidor; sincronizado com a conta após o login.
- Favoritos sem login (no dispositivo) e sincronizados com a conta ao entrar.
- Checkout em 6 etapas: identificação → endereço (com busca de CEP) → frete → revisão → pagamento → confirmação.
- Conta do cliente: dados pessoais, troca de senha, endereços (CRUD, principal), histórico e detalhe de pedidos com linha do tempo, pagar novamente ou cancelar pedidos aguardando pagamento.
- Recuperação de senha por e-mail (token de uso único com expiração).
- Mobile: header compacto, busca acessível, navegação inferior flutuante, filtros em gaveta, barra de compra fixa na página do produto, checkout simplificado.

**Painel administrativo** (`/admin`, somente papel `admin`)
- Dashboard: faturamento confirmado, vendas, pedidos, ticket médio, produtos, estoque baixo, gráfico diário, pedidos por status, pedidos recentes e mais vendidos.
- Produtos: busca, filtros, ativar/desativar, edição rápida de estoque, cadastro/edição completos (preço, promoção, especificações, upload de imagens com validação, capa, destaque) e exclusão protegida.
- Categorias: CRUD, ícone, ordem, ativação.
- Pedidos: filtros por status, busca, detalhe com cliente, itens, endereço, pagamentos e atualização de status com transições válidas (código de rastreio obrigatório para “Enviado”; cancelamento devolve estoque).
- Clientes: lista com total de pedidos/gasto, detalhe com endereços e pedidos, bloquear/reativar acesso.

## Endpoints principais da API

Prefixo padrão: `/api`. Documentação interativa completa em `/api/docs`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | público | saúde da API e do banco |
| GET | `/config` | público | parcelamento, frete grátis, pagamentos ativos |
| POST | `/auth/register` · `/auth/login` | público | cadastro e login (JWT) |
| GET | `/auth/me` | cliente | usuário logado |
| POST | `/auth/forgot-password` · `/auth/reset-password` | público | recuperação de senha |
| POST | `/auth/change-password` | cliente | troca de senha |
| GET/PATCH | `/users/me` | cliente | perfil |
| GET | `/categories` · `/categories/{slug}` | público | categorias |
| GET | `/products` | público | listagem com `q, category, brand, min_price, max_price, in_stock, min_rating, on_sale, sort, page, page_size` |
| GET | `/products/showcase` | público | vitrine da home em uma requisição |
| GET | `/products/{slug}` | público | produto + relacionados |
| GET/POST | `/products/{slug}/reviews` | público / cliente | avaliações |
| POST | `/cart/quote` | público | recalcula itens do carrinho |
| GET/PUT | `/cart` | cliente | carrinho salvo na conta |
| GET/POST/DELETE | `/favorites`, `/favorites/{id}`, `/favorites/sync` | cliente | favoritos |
| GET/POST/PUT/DELETE | `/addresses` | cliente | endereços |
| POST | `/shipping/quote` | público | opções de frete |
| POST/GET | `/orders`, `/orders/{id}`, `/orders/{id}/cancel` | cliente | pedidos |
| POST | `/payments/{order_id}/checkout` · `/payments/{order_id}/sync` | cliente | iniciar/consultar pagamento |
| POST | `/payments/webhook/mercadopago` | provedor | notificações do Mercado Pago |
| GET | `/admin/dashboard` | admin | indicadores |
| CRUD | `/admin/products`, `/admin/categories` | admin | catálogo |
| POST | `/admin/products/{id}/stock` · `/admin/uploads/image` | admin | estoque e upload |
| GET/PATCH | `/admin/orders`, `/admin/orders/{id}/status` | admin | pedidos |
| GET/PATCH | `/admin/customers`, `/admin/customers/{id}/active` | admin | clientes |

Erros seguem o formato `{"detail": "mensagem", "code": "codigo", "errors": [...]}`.

## Modelagem do MongoDB

Relacionamentos por identificador (`ObjectId`). Descrição completa dos campos em `backend/app/models/collections.py`; índices em `backend/app/core/database.py`.

| Coleção | Principais campos | Índices |
|---|---|---|
| `users` | name, email, password_hash, phone, cpf, role, active | email (único), role+created_at |
| `categories` | name, slug, description, icon, image, order, active | slug (único), order |
| `products` | name, slug, sku, brand, category_id, price, promo_price, final_price, stock, specs[], images[] (URLs), rating_avg, sold_count, featured, active, is_demo | slug/sku únicos, texto (nome/marca/descrição, português), categoria+preço, marca, mais vendidos, novidades, avaliação, estoque |
| `orders` | number, user_id, customer{}, items[] (snapshot de preço), shipping_address{}, shipping{}, subtotal, discount, shipping_price, total, status, status_history[], payment{} | number (único), user_id+data, status+data, data |
| `carts` | user_id, items[{product_id, quantity}] | user_id (único) |
| `favorites` | user_id, product_id | user_id+product_id (único) |
| `addresses` | user_id, recipient, cep, street, number, district, city, state, is_default | user_id+is_default |
| `payments` | order_id, provider, provider_payment_id, preference_id, status, amount | order_id, provider+payment_id |
| `reviews` | product_id, user_id, rating, comment | product+data, product+user (único) |
| `password_resets` | user_id, token_hash, expires_at, used | token (único), **TTL** em expires_at |
| `newsletter` | email | email (único) |
| `counters` | sequência do número do pedido | — |

Imagens **não** são armazenadas no banco: apenas URLs.

## Segurança

- Senhas com **bcrypt** (custo 12, pré-hash SHA-256); nunca em texto puro.
- **JWT** com expiração; o papel do usuário é sempre lido do banco (bloqueio/rebaixamento tem efeito imediato).
- Rotas administrativas protegidas no backend (`require_admin`) — o frontend apenas esconde a área.
- Validação com Pydantic em todas as entradas (CPF, CEP, UF, telefone, e-mail, senha forte, limites de tamanho).
- **Preços, descontos, frete, estoque e totais recalculados no servidor**; o cliente envia somente `product_id` e `quantity`.
- **Reserva atômica de estoque** ao criar o pedido (sem venda acima do estoque); cancelamento devolve.
- Pagamento aprovado **somente** após confirmação do provedor: o webhook consulta a API do Mercado Pago, valida a assinatura (se configurada) e confere o valor pago.
- Uploads: apenas JPG/PNG/WEBP verificados pela assinatura binária, limite de tamanho, nome aleatório.
- Limite de tentativas em login/cadastro/recuperação de senha; resposta idêntica para e-mails inexistentes.
- CORS restrito às origens configuradas; cabeçalhos de segurança; segredos apenas em `.env` (ignorado pelo git).
- Redirecionamentos pós-login aceitam apenas caminhos internos (evita *open redirect*).

## Integrações que dependem de credenciais

| Integração | Sem credenciais | Para ativar |
|---|---|---|
| **MongoDB Atlas** | a API não funciona | `MONGODB_URI` |
| **Mercado Pago** | o pedido é registrado como “Aguardando pagamento” e a loja informa que o pagamento online não está configurado — **nenhuma compra é aprovada** | Crie uma aplicação em <https://www.mercadopago.com.br/developers/panel>, copie o *Access Token* (use o de teste primeiro) para `MERCADOPAGO_ACCESS_TOKEN`. Em *Webhooks*, cadastre `https://SUA-API/api/payments/webhook/mercadopago` (evento “Pagamentos”) e copie a chave secreta para `MERCADOPAGO_WEBHOOK_SECRET`. `API_PUBLIC_URL` precisa ser acessível pela internet. |
| **E-mail (SMTP)** | links de recuperação de senha aparecem no **log da API** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (pode ser a conta de e-mail do cPanel) |
| **Frete real** | tabela de **demonstração** por região do CEP (valores não oficiais) + retirada na loja | Implementar `ShippingProvider` em `backend/app/services/shipping.py` (Correios, Melhor Envio, Frenet...) |
| **Armazenamento externo de imagens** | imagens salvas em `UPLOAD_DIR` e servidas em `/media` | Implementar `StorageBackend` em `backend/app/services/storage_service.py` (S3, Cloudflare R2, Cloudinary...) |
| **Busca de CEP** | usa a API pública ViaCEP (sem chave) só para preencher o formulário | — |

## Build de produção

### Frontend

```bat
cd frontend
copy .env.example .env.production
:: edite VITE_API_URL=https://api.seudominio.com.br/api  e  VITE_DEMO_MODE=false
npm run build
```

Os arquivos estáticos ficam em `frontend/dist/` (inclui o `.htaccess` para as rotas do React). Para checar os tipos antes do build: `npm run typecheck` (ou `npm run build:check`).

### Backend

No `.env` de produção: `APP_ENV=production`, `DEBUG=false`, `JWT_SECRET` forte, `CORS_ORIGINS=https://seudominio.com.br`, `FRONTEND_URL`, `API_PUBLIC_URL` e `MEDIA_BASE_URL` com as URLs reais.

## Publicação na HostGator

> **Importante:** nem todo plano compartilhado da HostGator executa aplicações Python. Verifique no cPanel se existe o recurso **“Setup Python App”** (Phusion Passenger) ou confirme com o suporte. Se o plano **não** oferecer, publique o frontend na HostGator e a API em uma VPS (HostGator VPS ou outra) — veja [Alternativa: VPS Linux](#alternativa-vps-linux). O projeto já está preparado para os dois cenários.

### 1. Frontend (qualquer plano)

1. Gere o build (`npm run build`).
2. No **Gerenciador de Arquivos** do cPanel (ou FTP), envie **o conteúdo** de `frontend/dist/` para `public_html/` (ou para a pasta do domínio). Certifique-se de que o arquivo oculto `.htaccess` foi enviado — ele faz as rotas como `/produto/...` funcionarem ao recarregar a página.
3. Ative o SSL gratuito (AutoSSL) e descomente o bloco “Força HTTPS” no `.htaccess`.
4. Se publicar em subpasta (ex.: `/loja/`), use `VITE_BASE_PATH=/loja/` no build e ajuste `RewriteBase /loja/` no `.htaccess`.

### 2. API no cPanel com “Setup Python App” (se disponível)

Recomendado: criar o subdomínio **`api.seudominio.com.br`** (cPanel → Domínios) para isolar a API.

1. Envie a pasta `backend/` (sem `.venv`, `__pycache__` e `.env` de desenvolvimento) para, por exemplo, `/home/USUARIO/sankamusic-api/`.
2. cPanel → **Setup Python App → Create Application**:
   - *Python version*: 3.10 ou superior
   - *Application root*: `sankamusic-api`
   - *Application URL*: `api.seudominio.com.br` (raiz do subdomínio)
   - *Application startup file*: `passenger_wsgi.py`
   - *Application Entry point*: `application`
3. Copie o comando “Enter to the virtual environment” exibido pelo cPanel, abra o **Terminal** do cPanel e execute:
   ```bash
   source /home/USUARIO/virtualenv/sankamusic-api/3.11/bin/activate && cd ~/sankamusic-api
   pip install -r requirements.txt
   cp .env.example .env && nano .env      # APP_ENV=production, credenciais reais
   python -m scripts.create_admin --email admin@seudominio.com.br
   ```
   (Rode `python -m scripts.seed` apenas se quiser os dados de demonstração.)
4. Em *Environment variables* do app, você também pode definir as variáveis em vez do `.env`.
5. Clique em **Restart**. Teste `https://api.seudominio.com.br/api/health`.
6. No Atlas, libere o IP de saída do servidor (*Network Access*). O IP aparece no cPanel ou pode ser obtido com o suporte.
7. Uploads: aponte `UPLOAD_DIR` para uma pasta pública, por ex. `/home/USUARIO/public_html/media`, e `MEDIA_BASE_URL=https://seudominio.com.br/media`.
8. No frontend, use `VITE_API_URL=https://api.seudominio.com.br/api` e, na API, `CORS_ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br`.

Observações do ambiente compartilhado: o `passenger_wsgi.py` usa o adaptador **a2wsgi** (ASGI → WSGI), por isso não é preciso um processo ASGI permanente; o limitador de tentativas é por processo; o Passenger pode “adormecer” a aplicação após inatividade (a primeira requisição fica mais lenta).

## Alternativa: VPS Linux

Para planos sem Python, ou para mais desempenho:

```bash
sudo apt update && sudo apt install -y python3-venv nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/sankamusic && sudo chown $USER /var/www/sankamusic
# envie as pastas backend/ e frontend/dist/ para /var/www/sankamusic/
cd /var/www/sankamusic/backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env && nano .env
sudo cp ../deploy/sankamusic-api.service.example /etc/systemd/system/sankamusic-api.service
sudo systemctl daemon-reload && sudo systemctl enable --now sankamusic-api
sudo cp ../deploy/nginx-sankamusic.conf.example /etc/nginx/sites-available/sankamusic
sudo ln -s /etc/nginx/sites-available/sankamusic /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Nesse cenário, frontend e API ficam no mesmo domínio: `VITE_API_URL=/api`.

## Testes

```bat
cd backend
.venv\Scripts\activate
pip install -r requirements-dev.txt
pytest -q
```

Cobrem: hash de senha, JWT, cálculo de preços, validações, catálogo/ordenação, autenticação, bloqueio do painel para clientes, criação de pedido com recálculo no servidor e reserva/devolução de estoque, recusa de produto sem estoque e pagamento indisponível sem credenciais. No frontend: `npm run typecheck`.

## Dados de demonstração

- `python -m scripts.seed` — cria/atualiza 11 categorias e 32 produtos **fictícios** (`is_demo: true`). Não cria pedidos, clientes nem avaliações.
- `python -m scripts.seed --clear-demo` — remove todos os produtos de demonstração (as categorias permanecem).
- `python -m scripts.generate_demo_images` — regenera as ilustrações vetoriais em `frontend/public/demo/`.

As ilustrações são vetoriais, sem marcas reais; substitua-as por fotos reais dos produtos ao cadastrar o catálogo oficial. Antes da abertura da loja: remova os dados demo, defina `VITE_DEMO_MODE=false`, preencha `src/utils/store.ts` e configure as regras comerciais no `.env`.
