# Vibe Computer Engineering

Website and store backend for Vibe Computer Engineering. The project provides a static multi-page website, a product catalog, customer request intake, and a small admin dashboard.

## Project Structure

| Path                  | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `index.html`          | Landing page, contact request form, and section navigation |
| `products.html`       | Product catalog and inquiry buttons                        |
| `Services.html`       | Services page                                              |
| `projects.html`       | Projects and case studies page                             |
| `server.js`           | Express API, static file server, and SQLite persistence    |
| `admin.html`          | Product and order administration dashboard                 |
| `database/schema.sql` | PostgreSQL table definitions and indexes                   |
| `database/seed.sql`   | PostgreSQL starter product catalog                         |
| `store.db`            | Local SQLite database created by the Node server           |

## Requirements

- Node.js 22.5 or newer
- npm
- PostgreSQL 14 or newer only if using the PostgreSQL migration scripts
- pgAdmin 4 is optional and provides a graphical PostgreSQL client

## Run The Current Application

The current application uses Node's built-in SQLite driver for a zero-configuration local database.

```powershell
npm install
$env:ADMIN_KEY = "replace-with-a-private-key"
npm start
```

Open:

- Website: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`

When `ADMIN_KEY` is not set, local development uses `vibe-admin`. Always set a private key before deployment.

The database is created automatically as `store.db` and is seeded with the starter catalog on its first run.

## Current API

| Method   | Endpoint                  | Purpose                        |
| -------- | ------------------------- | ------------------------------ |
| `GET`    | `/api/products`           | List products                  |
| `POST`   | `/api/orders`             | Store a customer request/order |
| `GET`    | `/api/admin/products`     | List products for admins       |
| `POST`   | `/api/admin/products`     | Add a product                  |
| `PATCH`  | `/api/admin/products/:id` | Update a product               |
| `DELETE` | `/api/admin/products/:id` | Delete a product               |
| `GET`    | `/api/admin/orders`       | List orders                    |
| `PATCH`  | `/api/admin/orders/:id`   | Update order status            |

Admin API requests require the `x-admin-key` header.

## PostgreSQL With psql

The included SQL files create the PostgreSQL version of the data model. The current `server.js` still uses SQLite; running these scripts does not switch the application driver automatically.

### 1. Create a PostgreSQL database

Open `psql` as the PostgreSQL administrator:

```sql
CREATE USER vibe_app WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE vibe_store OWNER vibe_app;
```

Exit the administrator session, then connect to the new database:

```powershell
psql -h localhost -p 5432 -U vibe_app -d vibe_store
```

### 2. Create the tables

From the project root, run:

```powershell
psql -h localhost -p 5432 -U vibe_app -d vibe_store -f database/schema.sql
psql -h localhost -p 5432 -U vibe_app -d vibe_store -f database/seed.sql
```

Enter the PostgreSQL password when prompted. Verify the result:

```sql
\dt
SELECT id, name, category, stock FROM products ORDER BY id;
SELECT COUNT(*) AS order_count FROM orders;
```

## PostgreSQL With pgAdmin 4

1. Open pgAdmin 4 and create or register a server.
2. Use `localhost` as the host and `5432` as the port.
3. Connect with the `vibe_app` user.
4. Create a database named `vibe_store`, owned by `vibe_app`.
5. Select `vibe_store`, open **Query Tool**, and run the complete contents of `database/schema.sql`.
6. Run the complete contents of `database/seed.sql`.
7. Refresh **Schemas > public > Tables** and confirm `products` and `orders` exist.

## Connecting Node To PostgreSQL Later

The PostgreSQL scripts are ready for migration. To switch the API from SQLite to PostgreSQL, install the `pg` package, add a `DATABASE_URL` environment variable, and replace the SQLite query layer in `server.js` with parameterized `pg` queries.

Example connection variable:

```powershell
$env:DATABASE_URL = "postgresql://vibe_app:your-password@localhost:5432/vibe_store"
```

Do not commit passwords, admin keys, or `.env` files. Use environment variables in development and deployment.

## Frontend Behavior

- Product `Inquire Now` buttons navigate to `index.html#contact`.
- The landing contact form submits requests to `/api/orders` when the Node server is running.
- The navbar remains consistent across the landing, products, services, and projects pages.

## Troubleshooting

- `database.transaction is not a function`: fixed by using explicit `BEGIN`, `COMMIT`, and `ROLLBACK` statements supported by Node's built-in SQLite API.
- `npm` or `node` is not recognized: restart the terminal after installing Node.js or use the full executable path.
- PostgreSQL connection refused: confirm the PostgreSQL service is running and that port `5432` is available.
- Admin access denied: set the same value in `ADMIN_KEY` and the dashboard's Admin key field.
