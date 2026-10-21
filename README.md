# Vibe Computer Engineering

Website and store backend for Vibe Computer Engineering. The project includes a multi-page website, a dynamic product catalog, customer order requests, and an administration dashboard.

## Project Structure

| Path                   | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `public/index.html`    | Landing page and contact form                          |
| `public/products.html` | Product catalog and inquiry buttons                    |
| `public/projects.html` | Projects and case studies                              |
| `public/admin.html`    | Product and order administration                       |
| `server.js`            | Express server, API routes, and PostgreSQL integration |
| `database/schema.sql`  | PostgreSQL table definitions and indexes               |
| `database/seed.sql`    | Starter product catalog                                |
| `package.json`         | Dependencies and application scripts                   |
| `vercel.json`          | Static website routing configuration                   |

## Requirements

- Node.js 22.5 or newer
- npm
- PostgreSQL 14 or newer
- A PostgreSQL database accessible to the application

## Environment Configuration

Create a `.env` file in the project root. Use your own PostgreSQL connection details and a strong, private admin key.

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
ADMIN_KEY=replace-with-a-strong-private-key
```

Do not commit `.env`, database passwords, or admin keys to GitHub. The `.env` file is excluded through `.gitignore`.

For a hosted PostgreSQL database, use the connection URL provided by your database provider. Follow the provider's SSL requirements.

## Run Locally

From the project root, run:

```bash
npm install
npm start
```

Open these addresses in your browser:

- Website: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`

Ensure PostgreSQL is running, `DATABASE_URL` is correct, and the database schema has been created before starting the application.

For development with automatic Node.js restarts:

```bash
npm run dev
```

## Database Setup

The project includes SQL files for PostgreSQL.

### Using psql

Create a database and application user using your PostgreSQL administrator account:

```sql
CREATE USER vibe_app WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE vibe_store OWNER vibe_app;
```

Connect to the database:

```bash
psql -h localhost -p 5432 -U vibe_app -d vibe_store
```

From the project root, create the tables and insert the starter catalog:

```bash
psql -h localhost -p 5432 -U vibe_app -d vibe_store -f database/schema.sql
psql -h localhost -p 5432 -U vibe_app -d vibe_store -f database/seed.sql
```

Verify the tables and data:

```sql
\dt
SELECT id, name, category, stock FROM products ORDER BY id;
SELECT COUNT(*) AS order_count FROM orders;
```

### Using pgAdmin 4

1. Connect to your PostgreSQL server.
2. Create the `vibe_store` database and configure its owner.
3. Open the database's Query Tool.
4. Execute the contents of `database/schema.sql`.
5. Execute the contents of `database/seed.sql`.
6. Refresh the Tables section and verify that `products` and `orders` exist.

## API Endpoints

| Method   | Endpoint                  | Purpose                            |
| -------- | ------------------------- | ---------------------------------- |
| `GET`    | `/api/products`           | Retrieve products                  |
| `POST`   | `/api/orders`             | Submit a customer order or request |
| `GET`    | `/api/admin/products`     | List products for administration   |
| `POST`   | `/api/admin/products`     | Add a product                      |
| `PATCH`  | `/api/admin/products/:id` | Update a product                   |
| `DELETE` | `/api/admin/products/:id` | Delete a product                   |
| `GET`    | `/api/admin/orders`       | List customer orders               |
| `PATCH`  | `/api/admin/orders/:id`   | Update order status                |

Administrative API requests require the `x-admin-key` header. Configure a strong `ADMIN_KEY` value and use the same key when accessing the admin dashboard.

## Frontend Behavior

- The product catalog retrieves products through `/api/products`.
- Product inquiry buttons direct visitors to `index.html#contact`.
- The landing page submits customer requests through `/api/orders`.
- Navigation links connect the website's main sections and pages.

## Deployment Notes

The current `vercel.json` configures static website routing. It does not, by itself, deploy the Express backend.

A production deployment needs:

1. The frontend deployed to a static hosting service such as Vercel.
2. The Express backend deployed to a Node.js hosting service.
3. A hosted PostgreSQL database.
4. Correct environment variables for the backend.
5. Frontend API routing configured to reach the deployed backend.

Product image uploads also require persistent storage. Files saved to a hosting service's temporary filesystem may disappear after a restart or redeployment. Use suitable persistent object storage for production uploads.

## Troubleshooting

- **PostgreSQL connection refused:** Check that the database is running and the host and port are correct.
- **Database authentication failed:** Verify the database username, password, and connection URL.
- **Missing tables:** Run the schema setup against the correct database.
- **Admin access denied:** Verify that the dashboard key matches the server's `ADMIN_KEY`.
- **Products fail to load on the hosted website:** Check the API URL and confirm that the backend is deployed and accessible.
- **`node` or `npm` is not recognized:** Verify the Node.js installation and restart the terminal.

## Security

- Never commit `.env` or production credentials.
- Use a strong, private `ADMIN_KEY`.
- Use HTTPS for production traffic.
- Configure database permissions and production environment variables carefully.
