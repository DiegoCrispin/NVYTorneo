# NoVanity Tournament

Sitio web estático para el torneo NoVanity.

## Despliegue en Netlify

Este proyecto es HTML, CSS y JavaScript puro. Para desplegarlo en Netlify:

1. **Conecta tu repositorio** a Netlify
2. **Configuración de build**:
   - Build command: (dejar vacío)
   - Publish directory: `.` (punto)
3. **Deploy!**

El archivo `netlify.toml` ya está configurado para que Netlify reconozca que es un sitio estático.

## Estructura del Proyecto

\`\`\`
/
├── index.html              # Página principal
├── admin.html              # Panel de administración
├── registro-equipo.html    # Formulario de registro
├── loading.html            # Pantalla de carga
├── styles.css              # Estilos
├── script.js               # JavaScript principal
├── admin.js                # JavaScript del admin
├── registro-equipo.js      # JavaScript del registro
├── netlify.toml            # Configuración de Netlify
└── package.json            # Metadata del proyecto
\`\`\`

## Desarrollo Local

Para probar localmente:

\`\`\`bash
# Opción 1: Usar Python
python -m http.server 8000

# Opción 2: Usar Node.js
npx serve .

# Opción 3: Usar PHP
php -S localhost:8000
\`\`\`

Luego abre `http://localhost:8000` en tu navegador.
