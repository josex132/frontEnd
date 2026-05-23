// ============================================================
// CONFIG — endpoints reales de la API Java
// ============================================================
const API_BASE      = "http://localhost:8080/api";
const API_PRODUCTOS = API_BASE + "/productos";
const API_USUARIOS  = API_BASE + "/usuarios";
const API_LOGIN     = API_BASE + "/usuarios/login";

let editandoProductoId = null;
let editandoUsuarioId  = null;
let modoOffline        = false;

// ============================================================
// DATOS QUEMADOS — siempre presentes, nunca se borran
// ============================================================
const USUARIOS_SEED = [
    { id: 9001, nombre: "Carlos Martínez",  correo: "carlos.martinez@gmail.com",
      edad: 32, rol: "Administrador", estado: true,
      fechaRegistro: "01/01/2025", ultimoLogin: "01/05/2025" },
    { id: 9002, nombre: "Laura Gómez",      correo: "laura.gomez@gmail.com",
      edad: 27, rol: "Empleado",      estado: true,
      fechaRegistro: "15/02/2025", ultimoLogin: "10/05/2025" },
    { id: 9003, nombre: "Andrés Torres",    correo: "andres.torres@gmail.com",
      edad: 35, rol: "Empleado",      estado: false,
      fechaRegistro: "20/03/2025", ultimoLogin: "01/04/2025" }
];

const PRODUCTOS_SEED = [
    { id: 8001, nombre: "Balón de Fútbol",  marca: "Adidas",   precio: 85000,
      stock: 25, categoria: "Fútbol",    ubicacion: "Pasillo A, Estante 1", fechaCreacion: "01/01/2025" },
    { id: 8002, nombre: "Raqueta de Tenis", marca: "Wilson",   precio: 220000,
      stock: 8,  categoria: "Tenis",     ubicacion: "Pasillo B, Estante 3", fechaCreacion: "15/02/2025" },
    { id: 8003, nombre: "Zapatos Running",  marca: "Nike",     precio: 310000,
      stock: 15, categoria: "Running",   ubicacion: "Pasillo C, Estante 2", fechaCreacion: "10/03/2025" },
    { id: 8004, nombre: "Gafas Natación",   marca: "Speedo",   precio: 45000,
      stock: 30, categoria: "Natación",  ubicacion: "Pasillo D, Estante 1", fechaCreacion: "05/04/2025" },
    { id: 8005, nombre: "Guantes Boxeo",    marca: "Everlast", precio: 130000,
      stock: 6,  categoria: "Boxeo",     ubicacion: "Pasillo E, Estante 4", fechaCreacion: "20/04/2025" }
];

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    aplicarSeedSiNoExiste();
    guardarUsuarioSesionEnLocal();
    await renderDashboard();
    await sincronizarSeedConAPI();
    renderInventario();
    renderUsuarios();
    renderBitacora();
});

function aplicarSeedSiNoExiste() {
    // Usuarios seed: insertar si no existen por ID
    const usuariosActuales = obtenerUsuarios();
    const idsU = new Set(usuariosActuales.map(u => u.id));
    const nuevosSeedU = USUARIOS_SEED.filter(u => !idsU.has(u.id));
    if (nuevosSeedU.length) guardarUsuariosLocal([...nuevosSeedU, ...usuariosActuales]);

    // Productos seed: insertar si no existen por ID
    const productosActuales = obtenerProductos();
    const idsP = new Set(productosActuales.map(p => p.id));
    const nuevosSeedP = PRODUCTOS_SEED.filter(p => !idsP.has(p.id));
    if (nuevosSeedP.length) guardarProductosLocal([...nuevosSeedP, ...productosActuales]);
}

// Envía los productos seed a la API si esta no los tiene todavía
async function sincronizarSeedConAPI() {
    try {
        const ctrl = { signal: AbortSignal.timeout(4000) };
        const res = await fetch(API_PRODUCTOS, ctrl);
        if (!res.ok) return;
        const productosAPI = await res.json();
        const idsAPI = new Set(productosAPI.map(p => String(p.nombre).toLowerCase()));
        // Solo enviar los que no existen en la API (comparar por nombre)
        const pendientes = PRODUCTOS_SEED.filter(p =>
            !idsAPI.has(p.nombre.toLowerCase())
        );
        for (const p of pendientes) {
            await fetch(API_PRODUCTOS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre: p.nombre, precio: p.precio, stock: p.stock, categoria: p.categoria })
            });
        }
    } catch { /* offline, no importa */ }
}

// ============================================================
// HELPERS DE ALMACENAMIENTO LOCAL
// ============================================================
function obtenerProductos()         { return JSON.parse(localStorage.getItem("productosLocales") || "[]"); }
function guardarProductosLocal(l)   { localStorage.setItem("productosLocales", JSON.stringify(l)); }
function obtenerUsuarios()          { return JSON.parse(localStorage.getItem("usuariosLocales") || "[]"); }
function guardarUsuariosLocal(l)    { localStorage.setItem("usuariosLocales", JSON.stringify(l)); }
function obtenerBitacora()          { return JSON.parse(localStorage.getItem("bitacoraProductos") || "[]"); }
function guardarBitacora(l)         { localStorage.setItem("bitacoraProductos", JSON.stringify(l)); }

// ============================================================
// FECHA / HORA
// ============================================================
function fechaHoy()       { return new Date().toLocaleDateString("es-CO"); }
function fechaHoraAhora() {
    const n = new Date();
    return n.toLocaleDateString("es-CO") + " " +
           n.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// BITÁCORA DE CAMBIOS
// ============================================================
function registrarCambio(accion, producto, detalle) {
    const b = obtenerBitacora();
    b.unshift({ fecha: fechaHoraAhora(), accion, producto, detalle });
    guardarBitacora(b.slice(0, 50));
    renderBitacora();
}

function renderBitacora() {
    const div = document.getElementById("dash-bitacora");
    if (!div) return;
    const b = obtenerBitacora();
    div.innerHTML = b.length === 0
        ? '<p style="color:#888;">No hay cambios registrados aún.</p>'
        : b.slice(0, 10).map(r => `
            <div style="background:#f0f4ea;border-left:4px solid var(--primary-green);
                        padding:8px 14px;border-radius:0 8px 8px 0;margin-bottom:6px;
                        display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
                <div>
                    <span style="font-weight:bold;color:var(--dark-green);">${r.accion}</span>
                    &nbsp;·&nbsp;<strong>${r.producto}</strong>
                    <small style="color:#777;display:block;margin-top:2px;">${r.detalle}</small>
                </div>
                <small style="color:#999;white-space:nowrap;">${r.fecha}</small>
            </div>`).join("");
}

// ============================================================
// MODALES
// ============================================================
function abrirModal(id)  { document.getElementById(id).classList.add("abierto"); }
function cerrarModal(id) { document.getElementById(id).classList.remove("abierto"); }

function parsearPrecio(p) {
    if (typeof p === "number") return p;
    const s = String(p).trim();
    if (s.includes(",")) return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
    const pts = s.split(".");
    if (pts.length === 2 && pts[1].length > 2) return parseFloat(s.replace(/\./g, "")) || 0;
    return parseFloat(s) || 0;
}

// ============================================================
// BANNER DE ESTADO
// ============================================================
function mostrarBanner(texto, tipo = "warn") {
    const b = document.getElementById("api-banner");
    if (!b) return;
    b.innerHTML = texto;
    b.className = tipo === "ok" ? "show conectado" : "show";
    // No se oculta: siempre muestra el estado actual de la API
}

// ============================================================
// GUARDAR USUARIO DE SESIÓN EN LOCAL
// ============================================================
function guardarUsuarioSesionEnLocal() {
    const sesion = JSON.parse(sessionStorage.getItem("usuarioLogueado") || "null");
    if (!sesion) return;
    const lista = obtenerUsuarios();
    if (!lista.some(u => u.correo === sesion.correo || u.id === sesion.id)) {
        lista.push({
            id: sesion.id || Date.now(), nombre: sesion.nombre || "Sin nombre",
            correo: sesion.correo || "", edad: sesion.edad || "-",
            rol: sesion.rol || "Empleado", estado: true,
            fechaRegistro: fechaHoy(), ultimoLogin: fechaHoraAhora()
        });
        guardarUsuariosLocal(lista);
    }
}

// ============================================================
// SINCRONIZACIÓN CON API
// La API Java devuelve: { id, nombre, correo, edad, rol, estado, contraseña }
// ============================================================
async function sincronizarConAPI() {
    try {
        const ctrl = { signal: AbortSignal.timeout(4000) };
        const [resP, resU] = await Promise.all([
            fetch(API_PRODUCTOS, ctrl),
            fetch(API_USUARIOS,  ctrl)
        ]);
        if (!resP.ok || !resU.ok) throw new Error("API error");

        const productosAPI = await resP.json();
        const usuariosAPI  = await resU.json();
        const localesP = obtenerProductos();
        const localesU = obtenerUsuarios();

        // ── Normalizar productos (API no tiene marca/ubicacion, se preservan del local) ──
        const normP = productosAPI.map(p => {
            const loc = localesP.find(l => l.id === p.id);
            return {
                id: p.id, nombre: p.nombre, precio: p.precio,
                stock: p.stock, categoria: p.categoria,
                marca:        loc?.marca         || "-",
                ubicacion:    loc?.ubicacion     || "-",
                fechaCreacion: loc?.fechaCreacion || fechaHoy()
            };
        });
        // Conservar locales que no están en la API (seed + offline)
        const idsApiP = new Set(productosAPI.map(p => p.id));
        const soloLocalesP = localesP.filter(p => !idsApiP.has(p.id));
        guardarProductosLocal([...normP, ...soloLocalesP]);

        // ── Normalizar usuarios ──
        const normU = usuariosAPI.map(u => {
            const loc = localesU.find(l =>
                l.correo?.toLowerCase() === u.correo?.toLowerCase() || l.id === u.id
            );
            return {
                id: u.id, nombre: u.nombre, correo: u.correo,
                edad: u.edad || loc?.edad || "-",
                rol: u.rol || "Empleado", estado: u.estado,
                fechaRegistro: loc?.fechaRegistro || fechaHoy(),
                ultimoLogin:   loc?.ultimoLogin   || fechaHoy()
            };
        });
        const idsApiU = new Set(usuariosAPI.map(u => u.correo?.toLowerCase()));
        const soloLocalesU = localesU.filter(u => !idsApiU.has(u.correo?.toLowerCase()));
        guardarUsuariosLocal([...normU, ...soloLocalesU]);

        modoOffline = false;
        mostrarBanner("🟢 &nbsp;API conectada — datos sincronizados", "ok");
        return true;
    } catch {
        modoOffline = true;
        mostrarBanner("🔴 &nbsp;API sin conexión — los cambios se guardan localmente");
        return false;
    }
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard() {
    await sincronizarConAPI();
    actualizarTarjetasDashboard();
    renderBitacora();
}

function actualizarTarjetasDashboard() {
    const productos = obtenerProductos();
    const usuarios  = obtenerUsuarios();
    const valorTotal = productos.reduce((s, p) =>
        s + parsearPrecio(p.precio) * (parseInt(p.stock) || 0), 0);
    const stockBajo = productos.filter(p => (parseInt(p.stock) || 0) < 10);

    document.getElementById("st-prod").textContent  = productos.length;
    document.getElementById("st-valor").textContent = "$" + valorTotal.toLocaleString("es-CO");
    document.getElementById("st-bajo").textContent  = stockBajo.length;
    document.getElementById("st-usr").textContent   = usuarios.length;

    const divA = document.getElementById("dash-alertas");
    if (divA) divA.innerHTML = stockBajo.length === 0
        ? '<p style="color:green;">✅ Todo el inventario está en buen estado.</p>'
        : stockBajo.map(p => `
            <div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 15px;
                        border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;">
                <span>⚠️ <strong>${p.nombre}</strong>
                    <small style="color:#888;">(${p.ubicacion || "Sin ubicación"})</small></span>
                <span style="color:red;font-weight:bold;">Stock: ${p.stock}</span>
            </div>`).join("");

    const divU = document.getElementById("dash-ultimos");
    if (divU) {
        const ultimos = [...productos].slice(-5).reverse();
        divU.innerHTML = ultimos.length === 0
            ? '<p style="color:#888;">No hay productos registrados.</p>'
            : ultimos.map(p => `
                <div style="background:#f5f8f0;border:1px solid #c8d8b0;padding:10px 15px;
                            border-radius:10px;margin-bottom:8px;
                            display:flex;justify-content:space-between;align-items:center;">
                    <span><strong>${p.nombre}</strong>
                        <small style="color:#888;">(${p.categoria}) · ${p.marca}</small></span>
                    <span style="color:var(--dark-green);font-weight:bold;">
                        $${parsearPrecio(p.precio).toLocaleString("es-CO")}</span>
                </div>`).join("");
    }
}

// ============================================================
// INVENTARIO — RENDER
// ============================================================
function renderInventario() {
    const productos = obtenerProductos();
    const tbody = document.getElementById("tabla-inventario");
    if (!tbody) return;
    tbody.innerHTML = productos.length === 0
        ? '<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">No hay productos.</td></tr>'
        : productos.map((p, i) => {
            const st = parseInt(p.stock) || 0;
            const badge = st < 10
                ? `<span style="background:#dc3545;color:white;padding:3px 10px;border-radius:20px;font-size:.8rem;font-weight:bold;">Stock Bajo</span>`
                : `<span style="background:#28a745;color:white;padding:3px 10px;border-radius:20px;font-size:.8rem;">Disponible</span>`;
            return `<tr>
                <td>${i + 1}</td>
                <td>${p.nombre}</td>
                <td>${p.marca || "—"}</td>
                <td>$${parsearPrecio(p.precio).toLocaleString("es-CO")}</td>
                <td>${st}</td>
                <td>${p.categoria || "—"}</td>
                <td>${p.ubicacion || '<span style="color:#aaa;">—</span>'}</td>
                <td>${badge}</td>
                <td>
                    <button class="btn-action edit-btn" onclick="abrirEditarProducto(${p.id})">✏️ Editar</button>
                    <button class="btn-action btn-del"  onclick="eliminarProducto(${p.id})">🗑 Eliminar</button>
                </td>
            </tr>`;
        }).join("");
}

// ============================================================
// INVENTARIO — CREAR
// API recibe: { nombre, precio, stock, categoria }
// marca y ubicacion se guardan solo en local (modelo Java no los incluye)
// ============================================================
async function crearProducto() {
    const nombre    = document.getElementById("np-nombre").value.trim();
    const marca     = document.getElementById("np-marca").value.trim();
    const precio    = parseFloat(document.getElementById("np-precio").value);
    const stock     = parseInt(document.getElementById("np-stock").value);
    const categoria = document.getElementById("np-cat").value;
    const ubicacion = document.getElementById("np-ubicacion")?.value.trim() || "";

    if (!nombre || !marca || isNaN(precio) || isNaN(stock)) {
        alert("Por favor completa todos los campos obligatorios."); return;
    }
    if (/^\d+$/.test(nombre)) {
        alert("El nombre no puede ser solo números."); return;
    }

    if (!modoOffline) {
        try {
            const res = await fetch(API_PRODUCTOS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, stock, categoria })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert("Error: " + (err.message || "Intenta de nuevo.")); return;
            }
            const creado = await res.json();
            // Enriquecer con campos extra en local
            const lista = obtenerProductos();
            lista.push({
                id: creado.id, nombre, marca, precio, stock,
                categoria, ubicacion, fechaCreacion: fechaHoy()
            });
            guardarProductosLocal(lista);
            registrarCambio("CREAR", nombre,
                `Marca: ${marca} · $${precio} · Stock: ${stock} · ${ubicacion || "Sin ubicación"}`);
            await sincronizarConAPI();
        } catch {
            _guardarProductoLocal(nombre, marca, precio, stock, categoria, ubicacion);
        }
    } else {
        _guardarProductoLocal(nombre, marca, precio, stock, categoria, ubicacion);
    }

    document.getElementById("modal-product-toggle").checked = false;
    _limpiarFormProducto();
    renderInventario();
    actualizarTarjetasDashboard();
}

function _guardarProductoLocal(nombre, marca, precio, stock, categoria, ubicacion) {
    const lista = obtenerProductos();
    const maxId = lista.reduce((m, p) => Math.max(m, p.id || 0), 0);
    lista.push({ id: maxId + 1, nombre, marca, precio, stock, categoria, ubicacion, fechaCreacion: fechaHoy() });
    guardarProductosLocal(lista);
    registrarCambio("CREAR (offline)", nombre, `$${precio} · Stock: ${stock}`);
}

function _limpiarFormProducto() {
    ["np-nombre","np-marca","np-precio","np-stock","np-ubicacion"].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = "";
    });
    const c = document.getElementById("np-cat"); if (c) c.selectedIndex = 0;
}

// ============================================================
// INVENTARIO — EDITAR
// ============================================================
function abrirEditarProducto(id) {
    const p = obtenerProductos().find(x => x.id == id);
    if (!p) return;
    editandoProductoId = id;
    document.getElementById("ep-nombre").value  = p.nombre;
    document.getElementById("ep-marca").value   = p.marca  || "";
    document.getElementById("ep-precio").value  = p.precio;
    document.getElementById("ep-stock").value   = p.stock;
    const eu = document.getElementById("ep-ubicacion"); if (eu) eu.value = p.ubicacion || "";
    const sel = document.getElementById("ep-cat");
    for (let i = 0; i < sel.options.length; i++)
        if (sel.options[i].value === p.categoria) { sel.selectedIndex = i; break; }
    abrirModal("modal-edit-prod");
}

async function guardarProducto() {
    const nombre    = document.getElementById("ep-nombre").value.trim();
    const marca     = document.getElementById("ep-marca").value.trim();
    const precio    = parseFloat(document.getElementById("ep-precio").value);
    const stock     = parseInt(document.getElementById("ep-stock").value);
    const categoria = document.getElementById("ep-cat").value;
    const ubicacion = document.getElementById("ep-ubicacion")?.value.trim() || "";
    const id        = editandoProductoId;

    if (!nombre || !marca || isNaN(precio) || isNaN(stock)) {
        alert("Por favor completa todos los campos."); return;
    }

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_PRODUCTOS}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, stock, categoria })
            });
            if (!res.ok) throw new Error();
            _actualizarProductoLocal(id, nombre, marca, precio, stock, categoria, ubicacion);
            registrarCambio("EDITAR", nombre,
                `Marca: ${marca} · $${precio} · Stock: ${stock} · ${ubicacion || "Sin ubicación"}`);
            await sincronizarConAPI();
        } catch {
            _actualizarProductoLocal(id, nombre, marca, precio, stock, categoria, ubicacion);
            registrarCambio("EDITAR (offline)", nombre, `$${precio} · Stock: ${stock}`);
        }
    } else {
        _actualizarProductoLocal(id, nombre, marca, precio, stock, categoria, ubicacion);
        registrarCambio("EDITAR (offline)", nombre, `$${precio} · Stock: ${stock}`);
    }

    cerrarModal("modal-edit-prod");
    editandoProductoId = null;
    renderInventario();
    actualizarTarjetasDashboard();
}

function _actualizarProductoLocal(id, nombre, marca, precio, stock, categoria, ubicacion) {
    const lista = obtenerProductos();
    const idx = lista.findIndex(p => p.id == id);
    if (idx !== -1) {
        lista[idx] = { ...lista[idx], nombre, marca, precio, stock, categoria, ubicacion };
        guardarProductosLocal(lista);
    }
}

// ============================================================
// INVENTARIO — ELIMINAR
// ============================================================
async function eliminarProducto(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    const p = obtenerProductos().find(x => x.id == id);
    const nombreP = p?.nombre || String(id);

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_PRODUCTOS}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            registrarCambio("ELIMINAR", nombreP, "Eliminado del servidor");
            await sincronizarConAPI();
        } catch {
            guardarProductosLocal(obtenerProductos().filter(x => x.id != id));
            registrarCambio("ELIMINAR (offline)", nombreP, "Eliminado localmente");
        }
    } else {
        guardarProductosLocal(obtenerProductos().filter(x => x.id != id));
        registrarCambio("ELIMINAR (offline)", nombreP, "Eliminado localmente");
    }
    renderInventario();
    actualizarTarjetasDashboard();
}

// ============================================================
// USUARIOS — RENDER
// ============================================================
function renderUsuarios() {
    const usuarios = obtenerUsuarios();
    const tbody = document.getElementById("tabla-usuarios");
    if (!tbody) return;
    tbody.innerHTML = usuarios.length === 0
        ? '<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">No hay usuarios.</td></tr>'
        : usuarios.map((u, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${u.nombre}</td>
                <td>${u.correo}</td>
                <td>${u.edad || "-"}</td>
                <td>${u.rol}</td>
                <td><span style="background:${u.estado ? "#28a745" : "#dc3545"};
                    color:white;padding:3px 10px;border-radius:20px;font-size:.8rem;">
                    ${u.estado ? "Activo" : "Inactivo"}</span></td>
                <td>${u.fechaRegistro || "-"}</td>
                <td>${u.ultimoLogin || "-"}</td>
                <td>
                    <button class="btn-action edit-btn" onclick="abrirEditarUsuario(${u.id})">✏️ Editar</button>
                    <button class="btn-action btn-del"  onclick="eliminarUsuario(${u.id})">🗑 Eliminar</button>
                </td>
            </tr>`).join("");
}

// ============================================================
// USUARIOS — CREAR
// API recibe: { nombre, correo, edad, rol, estado, contraseña }
// ============================================================
async function crearUsuario() {
    const nombre = document.getElementById("nu-nombre").value.trim();
    const correo = document.getElementById("nu-correo").value.trim();
    const edad   = parseInt(document.getElementById("nu-edad").value) || 0;
    const rol    = document.getElementById("nu-rol").value;

    if (!nombre || !correo) { alert("Por favor completa nombre y correo."); return; }

    if (!modoOffline) {
        try {
            const res = await fetch(API_USUARIOS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, correo, edad, rol, estado: true, contraseña: "usuario123" })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert("Error: " + (err.message || "Intenta de nuevo.")); return;
            }
            await sincronizarConAPI();
            // Inyectar fecha/estado en local tras sincronización
            const lista = obtenerUsuarios();
            const idx = lista.findIndex(u => u.correo?.toLowerCase() === correo.toLowerCase());
            if (idx !== -1) {
                lista[idx].edad = lista[idx].edad || (edad || "-");
                lista[idx].fechaRegistro = lista[idx].fechaRegistro || fechaHoy();
                lista[idx].ultimoLogin   = fechaHoraAhora();
                guardarUsuariosLocal(lista);
            }
        } catch {
            _guardarUsuarioLocal(nombre, correo, edad, rol);
        }
    } else {
        _guardarUsuarioLocal(nombre, correo, edad, rol);
    }

    const toggle = document.getElementById("modal-user-toggle");
    if (toggle) toggle.checked = false;
    _limpiarFormUsuario();
    renderUsuarios();
    actualizarTarjetasDashboard();
}

function _guardarUsuarioLocal(nombre, correo, edad, rol) {
    const lista = obtenerUsuarios();
    const maxId = lista.reduce((m, u) => Math.max(m, u.id || 0), 0);
    lista.push({
        id: maxId + 1, nombre, correo, edad: edad || "-", rol,
        estado: true, fechaRegistro: fechaHoy(), ultimoLogin: fechaHoraAhora()
    });
    guardarUsuariosLocal(lista);
}

function _limpiarFormUsuario() {
    ["nu-nombre","nu-correo","nu-edad"].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = "";
    });
    const s = document.getElementById("nu-rol"); if (s) s.selectedIndex = 0;
}

// ============================================================
// USUARIOS — EDITAR
// ============================================================
function abrirEditarUsuario(id) {
    const u = obtenerUsuarios().find(x => x.id == id);
    if (!u) return;
    editandoUsuarioId = id;
    document.getElementById("eu-nombre").value = u.nombre;
    document.getElementById("eu-correo").value = u.correo;
    document.getElementById("eu-edad").value   = (u.edad === "-") ? "" : u.edad;
    const sel = document.getElementById("eu-rol");
    for (let i = 0; i < sel.options.length; i++)
        if (sel.options[i].value === u.rol) { sel.selectedIndex = i; break; }
    abrirModal("modal-edit-usr");
}

async function guardarUsuario() {
    const nombre = document.getElementById("eu-nombre").value.trim();
    const correo = document.getElementById("eu-correo").value.trim();
    const edad   = parseInt(document.getElementById("eu-edad").value) || 0;
    const rol    = document.getElementById("eu-rol").value;
    const id     = editandoUsuarioId;

    if (!nombre || !correo) { alert("Por favor completa nombre y correo."); return; }

    // Recuperar contraseña guardada localmente para no perderla en el PUT
    const usuarioActual = obtenerUsuarios().find(u => u.id == id);
    const contrasenaGuardada = usuarioActual?.contraseña || "usuario123";

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_USUARIOS}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, correo, edad: edad || 1, rol, estado: true, contraseña: contrasenaGuardada })
            });
            if (!res.ok) throw new Error();
            await sincronizarConAPI();
            // Preservar edad localmente
            const lista = obtenerUsuarios();
            const idx = lista.findIndex(u => u.id == id);
            if (idx !== -1) { lista[idx].edad = edad || "-"; guardarUsuariosLocal(lista); }
        } catch {
            _actualizarUsuarioLocal(id, nombre, correo, edad, rol);
        }
    } else {
        _actualizarUsuarioLocal(id, nombre, correo, edad, rol);
    }

    cerrarModal("modal-edit-usr");
    editandoUsuarioId = null;
    renderUsuarios();
    actualizarTarjetasDashboard();
}

function _actualizarUsuarioLocal(id, nombre, correo, edad, rol) {
    const lista = obtenerUsuarios();
    const idx = lista.findIndex(u => u.id == id);
    if (idx !== -1) {
        lista[idx] = { ...lista[idx], nombre, correo, edad: edad || "-", rol };
        guardarUsuariosLocal(lista);
    }
}

// ============================================================
// USUARIOS — ELIMINAR
// ============================================================
async function eliminarUsuario(id) {
    if (!confirm("¿Eliminar este usuario?")) return;

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_USUARIOS}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            await sincronizarConAPI();
        } catch {
            guardarUsuariosLocal(obtenerUsuarios().filter(u => u.id != id));
        }
    } else {
        guardarUsuariosLocal(obtenerUsuarios().filter(u => u.id != id));
    }
    renderUsuarios();
    actualizarTarjetasDashboard();
}
