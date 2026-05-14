# API REST - Gestión de Productos y Usuarios (Corte 2)

**Estudiante:** Juan Sebastian Perez Poveda , Sebastian Galeano
**Institución:** Fundación Escuela Tecnológica (FET)  
**Materia:** Programación Orientada a Objetos / Ingeniería de Software

## Descripción del Proyecto
Este proyecto consiste en una API REST robusta desarrollada con **Spring Boot**. Implementa un sistema de gestión para un inventario de productos y una base de datos de usuarios. Se utiliza una **arquitectura de 4 capas** (Controller, Service, Repository, Model/DTO) para garantizar el desacoplamiento y la escalabilidad.

## Tecnologías Utilizadas
* **Java 17**
* **Spring Boot 3.x**
* **Maven** (Gestor de dependencias)
* **Persistencia:** HashMap en memoria (Simulación de base de datos)

## Lista de Endpoints Principales

### Productos
- `GET /api/productos` - Lista completa de productos (Ej: Laptop, Mouse).
- `GET /api/productos/{id}` - Búsqueda específica por ID.
- `POST /api/productos` - Registro de nuevos productos con validación.
- `PUT /api/productos/{id}` - Actualización de datos existentes.
- `DELETE /api/productos/{id}` - Eliminación lógica/física.

### Usuarios
- `GET /api/usuarios` - Listado de usuarios registrados.
- `POST /api/usuarios` - Registro de nuevos usuarios.

---

## Informe de Uso de Inteligencia Artificial

Siguiendo los requerimientos académicos, se detalla el uso de IA como herramienta de apoyo:

### 1. Prompts Utilizados
* *"Configurar un GlobalExceptionHandler para capturar errores de validación en Spring Boot."*
* *"Crear un Bean CommandLineRunner para insertar datos de prueba al iniciar la aplicación."*

### 2. ¿Qué generó la IA?
* El esqueleto de los controladores REST y las anotaciones estándar de Spring.
* Sugerencias de manejo de excepciones para evitar cierres inesperados de la API.

### 3. Ajustes y Correcciones del Grupo (Intervención Humana)
* **Arquitectura de Persistencia:** La IA sugirió inicialmente el uso de JPA/Hibernate. El grupo **corrigió esto manualmente** implementando un sistema de `HashMap` en la capa de **Repository** para cumplir con los objetivos pedagógicos del corte.
* **Refactorización de Paquetes:** Se ajustó manualmente la jerarquía de paquetes (`TrabajoAPI`) para solucionar errores de escaneo de componentes (Error 404) que la IA no detectaba por el contexto local.
* **Sincronización Lógica:** Se modificaron los nombres de los métodos generados (de inglés a español como `.guardar()` y `.buscarTodos()`) para mantener la coherencia con la lógica discutida en las tutorías.

---

## 📸 Evidencias de Funcionamiento
*(Nota: Las capturas de pantalla de Postman/Navegador se encuentran adjuntas en la carpeta `/Evidencias` del proyecto)*

1. **Prueba de Carga:** Captura del JSON con "Laptop" y "Mouse" al iniciar.
2. **Prueba de Salud:** Endpoint `/health` respondiendo con estado 200 OK.