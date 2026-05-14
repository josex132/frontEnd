// =============================================
// CONFIG GLOBAL
// =============================================
const API_BASE      = "http://localhost:8080/api";
const API_PRODUCTOS = API_BASE + "/productos";
const API_USUARIOS  = API_BASE + "/usuarios";

let editandoProductoId = null;
let editandoUsuarioId  = null;
let modoOffline        = false;

// =============================================
// AL CARGAR LA PÁGINA
// =============================================
document.addEventListener("DOMContentLoaded", async () => {
    // Limpiar localStorage viejo para evitar IDs acumulados
    limpiarCacheLocal();
    guardarUsuarioSesionEnLocal();
    await renderDashboard();
});

// =============================================
// LIMPIEZA DE CACHÉ (evita IDs acumulados)
// =============================================
function limpiarCacheLocal() {
    // Solo borramos productos: los IDs siempre los da el servidor
    // Usuarios locales se conservan (sesión actual)
    localStorage.removeItem('productosLocales');
}

// =============================================
// HELPERS DE ALMACENAMIENTO
// =============================================
function obtenerProductos() {
    return JSON.parse(localStorage.getItem('productosLocales') || '[]');
}

function guardarProductosLocal(lista) {
    localStorage.setItem('productosLocales', JSON.stringify(lista));
}

function obtenerUsuarios() {
    return JSON.parse(localStorage.getItem('usuariosLocales') || '[]');
}

function guardarUsuariosLocal(lista) {
    localStorage.setItem('usuariosLocales', JSON.stringify(lista));
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('abierto');
}

function abrirModal(id) {
    document.getElementById(id).classList.add('abierto');
}

function parsearPrecio(precio) {
    if (typeof precio === 'number') return precio;
    const str = String(precio).trim();
    if (str.includes(',')) {
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    const partes = str.split('.');
    if (partes.length === 2 && partes[1].length > 2) {
        return parseFloat(str.replace(/\./g, '')) || 0;
    }
    return parseFloat(str) || 0;
}

// =============================================
// GUARDAR USUARIO LOGUEADO
// =============================================
function guardarUsuarioSesionEnLocal() {
    const sesion = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    if (!sesion) return;

    const locales = obtenerUsuarios();
    const yaExiste = locales.some(u => u.correo === sesion.correo || u.id === sesion.id);

    if (!yaExiste) {
        locales.push({
            id:            sesion.id || Date.now(),
            nombre:        sesion.nombre  || 'Sin nombre',
            correo:        sesion.correo  || '',
            edad:          sesion.edad    || 0,
            rol:           sesion.rol     || 'Empleado',
            estado:        true,
            fechaRegistro: new Date().toLocaleDateString('es-CO'),
            ultimoLogin:   new Date().toLocaleDateString('es-CO')
        });
        guardarUsuariosLocal(locales);
    }
}

// =============================================
// BANNER DE ESTADO
// =============================================
function mostrarBanner(texto, tipo = 'warn') {
    const banner = document.getElementById('api-banner');
    if (!banner) return;
    banner.textContent = texto;
    banner.className = tipo === 'ok' ? 'show conectado' : 'show';
    if (tipo === 'ok') {
        setTimeout(() => { banner.className = ''; }, 3000);
    }
}

// =============================================
// SINCRONIZACIÓN CON API (fuente de verdad)
// =============================================
async function sincronizarConAPI() {
    try {
        const [resP, resU] = await Promise.all([
            fetch(API_PRODUCTOS),
            fetch(API_USUARIOS)
        ]);
        if (!resP.ok || !resU.ok) throw new Error('API no disponible');

        const productosAPI = await resP.json();
        const usuariosAPI  = await resU.json();

        // Normalizar productos: descripcion tiene formato "Categoria|Marca"
        const productosNorm = productosAPI.map(p => {
            const desc = p.descripcion ? p.descripcion.split('|') : ['-', '-'];
            return {
                id:        p.id,
                nombre:    p.nombre,
                marca:     desc[1]?.trim() || '-',
                precio:    p.precio,
                stock:     p.stock,
                categoria: desc[0]?.trim() || '-',
                disponible: p.disponible
            };
        });

        guardarProductosLocal(productosNorm);

        // Combinar usuarios de API + usuario de sesión local (sin duplicados)
        const usuariosLocales = obtenerUsuarios();
        const emailsAPI = usuariosAPI.map(u => u.email);

        const usuariosNorm = usuariosAPI.map(u => ({
            id:            u.id,
            nombre:        u.nombre,
            correo:        u.email,
            edad:          '-',
            rol:           u.rol || 'Empleado',
            estado:        u.activo,
            fechaRegistro: '-',
            ultimoLogin:   '-'
        }));

        // Agregar usuarios solo locales (sesión) que no están en la API
        const soloLocales = usuariosLocales.filter(u => !emailsAPI.includes(u.correo));
        guardarUsuariosLocal([...usuariosNorm, ...soloLocales]);

        modoOffline = false;
        mostrarBanner('✅ Conectado al servidor', 'ok');
        return true;
    } catch (e) {
        modoOffline = true;
        mostrarBanner('⚠️ Modo offline — los cambios se guardan localmente');
        return false;
    }
}

// =============================================
// DASHBOARD
// =============================================
async function renderDashboard() {
    await sincronizarConAPI();
    actualizarTarjetasDashboard();
}

function actualizarTarjetasDashboard() {
    const productos = obtenerProductos();
    const usuarios  = obtenerUsuarios();

    const valorTotal = productos.reduce((sum, p) => sum + parsearPrecio(p.precio), 0);
    const stockBajo  = productos.filter(p => (parseInt(p.stock) || 0) < 10);

    document.getElementById('st-prod').textContent  = productos.length;
    document.getElementById('st-valor').textContent = '$' + valorTotal.toLocaleString('es-CO');
    document.getElementById('st-bajo').textContent  = stockBajo.length;
    document.getElementById('st-usr').textContent   = usuarios.length;

    // Alertas stock bajo
    const divAlertas = document.getElementById('dash-alertas');
    divAlertas.innerHTML = stockBajo.length === 0
        ? '<p style="color:green;">✅ Todo el inventario está en buen estado.</p>'
        : stockBajo.map(p => `
            <div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 15px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;">
                <span>⚠️ <strong>${p.nombre}</strong></span>
                <span style="color:red;font-weight:bold;">Stock: ${p.stock}</span>
            </div>
        `).join('');

    // Últimos 5 productos agregados
    const divUltimos = document.getElementById('dash-ultimos');
    const ultimos = [...productos].slice(-5).reverse();
    divUltimos.innerHTML = ultimos.length === 0
        ? '<p style="color:#888;">No hay productos registrados.</p>'
        : ultimos.map(p => `
            <div style="background:#f5f8f0;border:1px solid #c8d8b0;padding:10px 15px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span><strong>${p.nombre}</strong> <small style="color:#888;">(${p.categoria})</small></span>
                <span style="color:var(--dark-green);font-weight:bold;">$${parsearPrecio(p.precio).toLocaleString('es-CO')}</span>
            </div>
        `).join('');
}

// =============================================
// INVENTARIO - RENDER TABLA
// =============================================
function renderInventario() {
    const productos = obtenerProductos();
    const tbody = document.getElementById('tabla-inventario');
    if (!tbody) return;

    tbody.innerHTML = productos.length === 0
        ? '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">No hay productos registrados.</td></tr>'
        : productos.map(p => {
            const stockVal = parseInt(p.stock) || 0;
            const stockBadge = stockVal < 10
                ? `<span style="background:#ffc107;color:#333;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:bold;">Stock bajo</span>`
                : `<span style="background:#28a745;color:white;padding:3px 10px;border-radius:20px;font-size:0.8rem;">${stockVal}</span>`;
            return `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nombre}</td>
                    <td>${p.marca}</td>
                    <td>$${parsearPrecio(p.precio).toLocaleString('es-CO')}</td>
                    <td>${stockBadge}</td>
                    <td>${p.categoria}</td>
                    <td>
                        <button class="btn-action edit-btn" onclick="abrirEditarProducto(${p.id})">✏️ Editar</button>
                        <button class="btn-action btn-del" onclick="eliminarProducto(${p.id})">🗑 Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
}

// =============================================
// INVENTARIO - CREAR PRODUCTO
// =============================================
async function crearProducto() {
    const nombre    = document.getElementById('np-nombre').value.trim();
    const marca     = document.getElementById('np-marca').value.trim();
    const precio    = parseFloat(document.getElementById('np-precio').value);
    const stock     = parseInt(document.getElementById('np-stock').value);
    const categoria = document.getElementById('np-cat').value;

    if (!nombre || !marca || isNaN(precio) || isNaN(stock)) {
        alert('Por favor completa todos los campos.');
        return;
    }

    if (!modoOffline) {
        try {
            const res = await fetch(API_PRODUCTOS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    descripcion: `${categoria}|${marca}`,
                    precio,
                    stock
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert('Error al crear: ' + (err.message || 'Intenta de nuevo.'));
                return;
            }

            // Resincronizar desde el servidor: los IDs los asigna el backend
            await sincronizarConAPI();
        } catch (e) {
            alert('No se pudo conectar al servidor. Guardando localmente.');
            guardarProductoLocal(nombre, marca, precio, stock, categoria);
        }
    } else {
        guardarProductoLocal(nombre, marca, precio, stock, categoria);
    }

    document.getElementById('modal-product-toggle').checked = false;
    limpiarFormProducto();
    renderInventario();
    actualizarTarjetasDashboard();
}

function guardarProductoLocal(nombre, marca, precio, stock, categoria) {
    const lista = obtenerProductos();
    // ID local: usar el máximo actual + 1 para evitar colisiones
    const maxId = lista.reduce((max, p) => Math.max(max, p.id || 0), 0);
    lista.push({ id: maxId + 1, nombre, marca, precio, stock, categoria });
    guardarProductosLocal(lista);
}

function limpiarFormProducto() {
    ['np-nombre', 'np-marca', 'np-precio', 'np-stock'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('np-cat').selectedIndex = 0;
}

// =============================================
// INVENTARIO - EDITAR PRODUCTO
// =============================================
function abrirEditarProducto(id) {
    const productos = obtenerProductos();
    const p = productos.find(x => x.id == id);
    if (!p) return;

    editandoProductoId = id;
    document.getElementById('ep-nombre').value = p.nombre;
    document.getElementById('ep-marca').value  = p.marca;
    document.getElementById('ep-precio').value = p.precio;
    document.getElementById('ep-stock').value  = p.stock;

    const sel = document.getElementById('ep-cat');
    for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === p.categoria) { sel.selectedIndex = i; break; }
    }

    abrirModal('modal-edit-prod');
}

async function guardarProducto() {
    const nombre    = document.getElementById('ep-nombre').value.trim();
    const marca     = document.getElementById('ep-marca').value.trim();
    const precio    = parseFloat(document.getElementById('ep-precio').value);
    const stock     = parseInt(document.getElementById('ep-stock').value);
    const categoria = document.getElementById('ep-cat').value;

    if (!nombre || !marca || isNaN(precio) || isNaN(stock)) {
        alert('Por favor completa todos los campos.');
        return;
    }

    const id = editandoProductoId;

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_PRODUCTOS}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    descripcion: `${categoria}|${marca}`,
                    precio,
                    stock
                })
            });
            if (!res.ok) throw new Error();
            await sincronizarConAPI();
        } catch {
            actualizarProductoLocal(id, nombre, marca, precio, stock, categoria);
        }
    } else {
        actualizarProductoLocal(id, nombre, marca, precio, stock, categoria);
    }

    cerrarModal('modal-edit-prod');
    editandoProductoId = null;
    renderInventario();
    actualizarTarjetasDashboard();
}

function actualizarProductoLocal(id, nombre, marca, precio, stock, categoria) {
    const lista = obtenerProductos();
    const idx = lista.findIndex(p => p.id == id);
    if (idx !== -1) {
        lista[idx] = { ...lista[idx], nombre, marca, precio, stock, categoria };
        guardarProductosLocal(lista);
    }
}

// =============================================
// INVENTARIO - ELIMINAR PRODUCTO
// =============================================
async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_PRODUCTOS}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            await sincronizarConAPI();
        } catch {
            eliminarProductoLocal(id);
        }
    } else {
        eliminarProductoLocal(id);
    }

    renderInventario();
    actualizarTarjetasDashboard();
}

function eliminarProductoLocal(id) {
    const lista = obtenerProductos().filter(p => p.id != id);
    guardarProductosLocal(lista);
}

// =============================================
// USUARIOS - RENDER TABLA
// =============================================
function renderUsuarios() {
    const usuarios = obtenerUsuarios();
    const tbody = document.getElementById('tabla-usuarios');
    if (!tbody) return;

    tbody.innerHTML = usuarios.length === 0
        ? '<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">No hay usuarios registrados.</td></tr>'
        : usuarios.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.nombre}</td>
                <td>${u.correo}</td>
                <td>${u.edad || '-'}</td>
                <td>${u.rol}</td>
                <td>
                    <span style="background:${u.estado ? '#28a745' : '#dc3545'};color:white;padding:3px 10px;border-radius:20px;font-size:0.8rem;">
                        ${u.estado ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${u.fechaRegistro || '-'}</td>
                <td>${u.ultimoLogin || '-'}</td>
                <td>
                    <button class="btn-action edit-btn" onclick="abrirEditarUsuario(${u.id})">✏️ Editar</button>
                    <button class="btn-action btn-del" onclick="eliminarUsuario(${u.id})">🗑 Eliminar</button>
                </td>
            </tr>
        `).join('');
}

// =============================================
// USUARIOS - CREAR
// =============================================
async function crearUsuario() {
    const nombre = document.getElementById('nu-nombre').value.trim();
    const correo = document.getElementById('nu-correo').value.trim();
    const edad   = parseInt(document.getElementById('nu-edad').value) || 0;
    const rol    = document.getElementById('nu-rol').value;

    if (!nombre || !correo) {
        alert('Por favor completa nombre y correo.');
        return;
    }

    // La API requiere password; usamos uno temporal
    const password = 'usuario123';

    if (!modoOffline) {
        try {
            const res = await fetch(API_USUARIOS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email: correo, password, rol })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert('Error: ' + (err.message || 'Intenta de nuevo.'));
                return;
            }

            await sincronizarConAPI();
        } catch {
            guardarUsuarioLocal(nombre, correo, edad, rol);
        }
    } else {
        guardarUsuarioLocal(nombre, correo, edad, rol);
    }

    document.getElementById('modal-user-toggle').checked = false;
    limpiarFormUsuario();
    renderUsuarios();
    actualizarTarjetasDashboard();
}

function guardarUsuarioLocal(nombre, correo, edad, rol) {
    const lista = obtenerUsuarios();
    const maxId = lista.reduce((max, u) => Math.max(max, u.id || 0), 0);
    lista.push({
        id: maxId + 1,
        nombre, correo, edad, rol,
        estado: true,
        fechaRegistro: new Date().toLocaleDateString('es-CO'),
        ultimoLogin: new Date().toLocaleDateString('es-CO')
    });
    guardarUsuariosLocal(lista);
}

function limpiarFormUsuario() {
    ['nu-nombre', 'nu-correo', 'nu-edad'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('nu-rol').selectedIndex = 0;
}

// =============================================
// USUARIOS - EDITAR
// =============================================
function abrirEditarUsuario(id) {
    const usuarios = obtenerUsuarios();
    const u = usuarios.find(x => x.id == id);
    if (!u) return;

    editandoUsuarioId = id;
    document.getElementById('eu-nombre').value = u.nombre;
    document.getElementById('eu-correo').value = u.correo;
    document.getElementById('eu-edad').value   = u.edad || '';

    const sel = document.getElementById('eu-rol');
    for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === u.rol) { sel.selectedIndex = i; break; }
    }

    abrirModal('modal-edit-usr');
}

async function guardarUsuario() {
    const nombre = document.getElementById('eu-nombre').value.trim();
    const correo = document.getElementById('eu-correo').value.trim();
    const edad   = parseInt(document.getElementById('eu-edad').value) || 0;
    const rol    = document.getElementById('eu-rol').value;

    if (!nombre || !correo) {
        alert('Por favor completa nombre y correo.');
        return;
    }

    const id = editandoUsuarioId;

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_USUARIOS}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email: correo, password: 'usuario123', rol })
            });
            if (!res.ok) throw new Error();
            await sincronizarConAPI();
        } catch {
            actualizarUsuarioLocal(id, nombre, correo, edad, rol);
        }
    } else {
        actualizarUsuarioLocal(id, nombre, correo, edad, rol);
    }

    cerrarModal('modal-edit-usr');
    editandoUsuarioId = null;
    renderUsuarios();
    actualizarTarjetasDashboard();
}

function actualizarUsuarioLocal(id, nombre, correo, edad, rol) {
    const lista = obtenerUsuarios();
    const idx = lista.findIndex(u => u.id == id);
    if (idx !== -1) {
        lista[idx] = { ...lista[idx], nombre, correo, edad, rol };
        guardarUsuariosLocal(lista);
    }
}

// =============================================
// USUARIOS - ELIMINAR
// =============================================
async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;

    if (!modoOffline) {
        try {
            const res = await fetch(`${API_USUARIOS}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            await sincronizarConAPI();
        } catch {
            eliminarUsuarioLocal(id);
        }
    } else {
        eliminarUsuarioLocal(id);
    }

    renderUsuarios();
    actualizarTarjetasDashboard();
}

function eliminarUsuarioLocal(id) {
    const lista = obtenerUsuarios().filter(u => u.id != id);
    guardarUsuariosLocal(lista);
}
