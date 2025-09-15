# HUERTOHOGAR - E-commerce Full-Stack Application

Una plataforma de comercio electrónico completa para venta de frutas y verduras frescas, desarrollada con Node.js/Express backend y frontend en HTML/CSS/JavaScript.

## 🚀 Características Implementadas

### ✅ Backend (Node.js + Express + SQLite)
- **Autenticación segura** con JWT y cookies httpOnly
- **Base de datos SQLite** con tablas: usuarios, pedidos, y detalles de pedidos
- **API RESTful** completa con endpoints para:
  - Registro y login de usuarios (`/api/auth/register`, `/api/auth/login`)
  - Gestión de perfil (`/api/profile`)
  - Historial de pedidos (`/api/orders`)
- **Middlewares de seguridad** para proteger rutas
- **Hash de contraseñas** con bcrypt
- **Validación de datos** y manejo de errores

### ✅ Frontend Autenticado
- **Páginas de registro y login** con validación
- **Carrito de compras** usando sessionStorage (no persiste entre sesiones)
- **Página de perfil** protegida para gestión de datos de usuario
- **Página "Mis Compras"** para ver historial de pedidos
- **Sistema de navegación** que cambia según estado de autenticación
- **Integración de productos** con botones "Agregar al carrito" funcionales

### ✅ Funcionalidades de Compra
- **Carrito dinámico** con contador en navbar
- **Proceso de checkout** que requiere autenticación
- **Creación de pedidos** automática al confirmar compra
- **Historial de compras** accessible desde panel de usuario

## 🛠️ Instalación y Uso

### Requisitos Previos
- Node.js (v14 o superior)
- npm

### Instalación del Backend

```bash
# Clonar el repositorio
git clone [repository-url]
cd Fullstack

# Instalar dependencias del servidor
cd server
npm install

# Crear archivo de configuración (opcional)
cp .env.example .env
# Editar .env con tu JWT_SECRET personalizado
```

### Ejecutar la Aplicación

```bash
# Desde el directorio server/
npm run dev
```

La aplicación estará disponible en: http://localhost:3000/

### Estructura del Proyecto

```
Fullstack/
├── server/                 # Backend Node.js
│   ├── index.js           # Servidor principal
│   ├── database.js        # Configuración de SQLite
│   ├── auth.js           # Middleware de autenticación
│   ├── package.json       # Dependencias del backend
│   └── .env.example       # Variables de entorno
├── HUERTOHOGAR/           # Frontend estático
│   ├── home.html          # Página principal
│   ├── login.html         # Página de inicio de sesión
│   ├── registro.html      # Página de registro
│   ├── perfil.html        # Página de perfil (protegida)
│   ├── MisCompras.html    # Historial de pedidos (protegida)
│   ├── carrito.html       # Carrito de compras
│   ├── function.js        # Lógica JavaScript principal
│   ├── assets/
│   │   └── style.css      # Estilos personalizados
│   ├── productos/         # Páginas de productos individuales
│   └── categorias/        # Páginas de categorías
└── README.md              # Este archivo
```

## 🔐 Sistema de Autenticación

### Registro de Usuario
1. Visita `http://localhost:3000/registro.html`
2. Completa el formulario con nombre, email y contraseña
3. El sistema redirige automáticamente al login tras registro exitoso

### Inicio de Sesión
1. Visita `http://localhost:3000/login.html`
2. Ingresa email y contraseña
3. Al autenticarse, el navbar cambia para mostrar opciones de usuario

### Usuario de Prueba
Para probar rápidamente, puedes usar:
- **Email:** test@example.com
- **Contraseña:** testpass123

(Este usuario se crea automáticamente en la primera ejecución)

## 🛒 Funcionalidad del Carrito

### Agregar Productos
- Navega a cualquier página de producto (ej: `/productos/ManzanaFuji.html`)
- Selecciona cantidad deseada
- Haz clic en "Agregar al carrito"
- El contador del carrito se actualiza automáticamente

### Realizar Compra
1. Ve al carrito haciendo clic en el ícono de carrito
2. Revisa los productos agregados
3. Haz clic en "Comprar" (requiere estar autenticado)
4. El sistema crea automáticamente el pedido y limpia el carrito
5. Redirige a "Mis Compras" para ver el pedido creado

## 📊 Base de Datos

### Tablas Creadas Automáticamente
- **users**: id, name, email, phone, address, avatar_url, password_hash, created_at
- **orders**: id, user_id, total, created_at
- **order_items**: id, order_id, product_id, name, price, qty

La base de datos se inicializa automáticamente en `server/huertohogar.db`

## 🎨 Tecnologías Utilizadas

### Backend
- **Node.js** + **Express.js**
- **SQLite** (better-sqlite3)
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **CORS** para comunicación frontend-backend

### Frontend
- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Bootstrap 5.3** para diseño responsivo
- **sessionStorage** para carrito (no persiste entre sesiones)
- **Fetch API** para comunicación con backend

## 🔧 Configuración

### Variables de Entorno (.env)
```env
JWT_SECRET=tu-clave-jwt-super-secreta-cambiar-en-produccion-minimo-32-chars
PORT=3000
NODE_ENV=development
```

### Características de Seguridad
- Cookies httpOnly para JWT
- Hash seguro de contraseñas con bcrypt
- Validación de datos en frontend y backend
- Protección CORS configurada

## 📱 Diseño Responsivo

La aplicación utiliza Bootstrap para garantizar compatibilidad móvil y diseño adaptativo en todos los dispositivos.

## 🚧 Estado Actual

### ✅ Completado
- Backend completo con autenticación
- Registro y login funcionales
- Carrito de compras operativo
- Creación y visualización de pedidos
- Páginas de perfil y historial
- Integración producto-carrito

### 🔄 En Progreso
- Actualización de navbar en todas las páginas
- Datos de productos desde base de datos
- Gestión de stock en tiempo real

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de un ejercicio académico para el curso DSY1104.

---

**Huerto Hogar** - Frutas y verduras frescas para tu hogar 🥕🍎