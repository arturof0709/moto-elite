# MotoParts — tienda dinámica de accesorios para motos de alto cilindraje

React + Vite (frontend) · Node + Express (backend) · MySQL

## Base de datos (7 tablas relacionadas)
```
categorias 1──N productos N──1 marcas
productos 1──N detalle_pedido N──1 pedidos N──1 clientes
productos 1──N resenas N──1 clientes
```

## Puesta en marcha
1. **Backend**
   ```bash
   cd backend
   cp .env.example .env      # edita DB_USER y DB_PASSWORD
   npm install
   npm run db:init           # crea la BD "tienda_motos" con datos de ejemplo
   npm run dev               # http://localhost:4000/api
   ```
   (También puedes importar `backend/database/schema.sql` desde MySQL Workbench.)
2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev               # http://localhost:5173
   ```

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/categorias, /api/marcas | Listas para filtros |
| GET | /api/productos?categoria=&marca=&q=&orden= | Catálogo con promedio de reseñas |
| GET | /api/productos/:id | Detalle + reseñas |
| POST | /api/pedidos | Crea cliente, pedido y detalle; descuenta stock (transacción) |
| GET | /api/pedidos?email= | Historial del cliente |
| POST | /api/resenas | Publica una reseña (el correo debe existir en clientes) |
