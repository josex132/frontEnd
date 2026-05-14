// =============================================
// CONFIG GLOBAL
// =============================================
const API_BASE = "http://localhost:8080/api";
const API_PRODUCTOS = API_BASE + "/productos";
const API_USUARIOS  = API_BASE + "/usuarios";
 
let editandoProductoId = null;
let editandoUsuarioId  = null;
 
// =============================================
// AL CARGAR LA PÁGINA
// =============================================
document.addEventListener("DOMContentLoaded", () => {
    guardarUsuarioSesionEnLocal(); // <- Esto resuelve tu pregunta principal
    renderDashboard();
});
 
// =============================================
// GUARDAR USUARIO LOGUEADO EN LISTA LOCAL
// Así aparece en el apartado de Usuarios
// =============================================
function guardarUsuarioSesionEnLocal() {
    const sesion = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    if (!sesion) return;
 
    const locales = JSON.parse(localStorage.getItem('usuariosLocales') || '[]');
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
        localStorage.setItem('usuariosLocales', JSON.stringify(locales));
    } else {
        // Actualiza el último login
        const idx = locales.findIndex(u => u.correo === sesion.correo || u.id === sesion.id);
        if (idx !== -1) {
            locales[idx].ultimoLogin = new Date().toLocaleDateString('es-CO');
            localStorage.setItem('usuariosLocales', JSON.stringify(locales));
        }
    }
}
 
// =============================================
// HELPERS
// =============================================
function cerrarModal(id) {
    document.getElementById(id).classList.remove('abierto');
}
 
function abrirModal(id) {
    document.getElementById(id).classList.add('abierto');
}
 
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
 
// =============================================
// DASHBOARD
// =============================================
function renderDashboard() {
    const productos = obtenerProductos();
    const usuarios  = obtenerUsuarios();
 
    const valorTotal = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);
    const stockBajo  = productos.filter(p => p.stock < 10);
 
    document.getElementById('st-prod').textContent  = productos.length;
    document.getElementById('st-valor').textContent = '$' + valorTotal.toLocaleString('es-CO');
    document.getElementById('st-bajo').textContent  = stockBajo.length;
    document.getElementById('st-usr').textContent   = usuarios.length;
 
    // Alertas de stock bajo
    const divAlertas = document.getElementById('dash-alertas');
    if (stockBajo.length === 0) {
        divAlertas.innerHTML = '<p style="color:green;">✅ Todo el inventario está en buen estado.</p>';
    } else {
        divAlertas.innerHTML = stockBajo.map(p => `
            <div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 15px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;">
                <span>⚠️ <strong>${p.nombre}</strong> (${p.marca})</span>
                <span style="color:red;font-weight:bold;">Stock: ${p.stock}</span>
            </div>
        `).join('');
    }
 
    // Últimos productos
    const divUltimos = document.getElementById('dash-ultimos');
    const ultimos = [...productos].reverse().slice(0, 5);
    if (ultimos.length === 0) {
        divUltimos.innerHTML = '<p style="color:#999;">No hay productos registrados aún.</p>';
    } else {
        divUltimos.innerHTML = ultimos.map(p => `
            <div style="display:flex;justify-content:space-between;padding:10px 15px;background:var(--light-green);border-radius:10px;margin-bottom:8px;">
                <span><strong>${p.nombre}</strong> — ${p.marca}</span>
                <span>$${p.precio.toLocaleString('es-CO')} | Stock: ${p.stock}</span>
            </div>
        `).join('');
    }
 
    // Intenta sincronizar con la API en segundo plano
    sincronizarConAPI();
}
 
// =============================================
// SINCRONIZACIÓN CON API (en segundo plano)
// =============================================
async function sincronizarConAPI() {
    const banner = document.getElementById('api-banner');
    try {
        const [resP, resU] = await Promise.all([
            fetch(API_PRODUCTOS),
            fetch(API_USUARIOS)
        ]);
        if (!resP.ok || !resU.ok) throw new Error();
 
        const productos = await resP.json();
        const usuarios  = await resU.json();
 
        // Normaliza campos de usuarios de la API
        const usuariosNorm = usuarios.map(u => ({
            id:            u.id,
            nombre:        u.nombre,
            correo:        u.email || u.correo || '',
            edad:          u.edad  || 0,
            rol:           u.rol   || 'Empleado',
            estado:        u.estado !== undefined ? u.estado : true,
            fechaRegistro: u.fechaRegistro || new Date().toLocaleDateString('es-CO'),
            ultimoLogin:   u.ultimoLogin   || new Date().toLocaleDateString('es-CO')
        }));
 
        // Mezcla: usuarios de la API + el usuario logueado (si no está en la API)
        const sesion = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
        if (sesion) {
            const yaEsta = usuariosNorm.some(u => u.correo === sesion.correo);
            if (!yaEsta) {
                const local = obtenerUsuarios().find(u => u.correo === sesion.correo);
                if (local) usuariosNorm.push(local);
            }
        }
 
        guardarProductosLocal(productos);
        guardarUsuariosLocal(usuariosNorm);
 
        banner.textContent = '✅ Conectado al servidor';
        banner.className = 'show conectado';
        setTimeout(() => banner.className = '', 3000);
 
    } catch (e) {
        banner.textContent = '⚠️ Modo offline — los datos se guardan localmente';
        banner.className = 'show';
    }
}
 
// =============================================
// INVENTARIO
// =============================================
function renderInventario() {
    const tbody    = document.getElementById('tabla-inventario');
    const productos = obtenerProductos();
 
    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;">No hay productos registrados.</td></tr>`;
        return;
    }
 
    tbody.innerHTML = productos.map(p => {
        let badge;
        if (p.stock <= 0)       badge = `<span style="background:red;color:white;padding:3px 10px;border-radius:20px;">Agotado</span>`;
        else if (p.stock < 10)  badge = `<span style="background:orange;color:white;padding:3px 10px;border-radius:20px;">Stock bajo</span>`;
        else                    badge = `<span style="background:#49D93B;color:black;padding:3px 10px;border-radius:20px;">Disponible</span>`;
 
        return `
            <tr>
                <td>${p.id}</td>
                <td>${p.nombre}</td>
                <td>${p.marca || '-'}</td>
                <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
                <td>${badge}</td>
                <td>${p.categoria || '-'}</td>
                <td>
                    <button class="btn-action edit-btn" onclick="abrirEditarProducto(${p.id})">✏️ Editar</button>
                    <button class="btn-action btn-del" onclick="eliminarProducto(${p.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');
}
 
// Crear producto (desde modal "Nuevo Producto")
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
 
    const nuevo = { nombre, marca, precio, stock, categoria };
 
    try {
        const res = await fetch(API_PRODUCTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: `${categoria}|${marca}`, precio, stock })
        });
        if (!res.ok) throw new Error();
        const creado = await res.json();
        nuevo.id = creado.id;
    } catch {
        nuevo.id = Date.now();
    }
 
    const lista = obtenerProductos();
    lista.push(nuevo);
    guardarProductosLocal(lista);
 
    // Cierra modal y recarga
    document.getElementById('modal-product-toggle').checked = false;
    limpiarFormProducto();
    renderInventario();
    renderDashboard();
}
 
function limpiarFormProducto() {
    ['np-nombre','np-marca','np-precio','np-stock'].forEach(id => {
        document.getElementById(id).value = '';
    });
}
 
// Abrir modal editar producto
function abrirEditarProducto(id) {
    const productos = obtenerProductos();
    const p = productos.find(x => x.id === id);
    if (!p) return;
 
    editandoProductoId = id;
    document.getElementById('ep-nombre').value = p.nombre;
    document.getElementById('ep-marca').value  = p.marca || '';
    document.getElementById('ep-precio').value = p.precio;
    document.getElementById('ep-stock').value  = p.stock;
    document.getElementById('ep-cat').value    = p.categoria || 'Fútbol';
    abrirModal('modal-edit-prod');
}
 
// Guardar edición de producto
async function guardarProducto() {
    const id        = editandoProductoId;
    const nombre    = document.getElementById('ep-nombre').value.trim();
    const marca     = document.getElementById('ep-marca').value.trim();
    const precio    = parseFloat(document.getElementById('ep-precio').value);
    const stock     = parseInt(document.getElementById('ep-stock').value);
    const categoria = document.getElementById('ep-cat').value;
 
    if (!nombre || !marca || isNaN(precio) || isNaN(stock)) {
        alert('Completa todos los campos.');
        return;
    }
 
    try {
        await fetch(API_PRODUCTOS + '/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: `${categoria}|${marca}`, precio, stock })
        });
    } catch {}
 
    const lista = obtenerProductos();
    const idx   = lista.findIndex(x => x.id === id);
    if (idx !== -1) lista[idx] = { id, nombre, marca, precio, stock, categoria };
    guardarProductosLocal(lista);
 
    cerrarModal('modal-edit-prod');
    renderInventario();
    renderDashboard();
}
 
async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        await fetch(API_PRODUCTOS + '/' + id, { method: 'DELETE' });
    } catch {}
    const lista = obtenerProductos().filter(p => p.id !== id);
    guardarProductosLocal(lista);
    renderInventario();
    renderDashboard();
}
 
// =============================================
// USUARIOS
// =============================================
function renderUsuarios() {
    const tbody   = document.getElementById('tabla-usuarios');
    const usuarios = obtenerUsuarios();
 
    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#999;">No hay usuarios registrados.</td></tr>`;
        return;
    }
 
    tbody.innerHTML = usuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.correo}</td>
            <td>${u.edad || '-'}</td>
            <td>${u.rol}</td>
            <td>
                <span style="background:${u.estado ? '#49D93B' : '#ccc'};color:${u.estado ? 'black' : '#555'};padding:3px 10px;border-radius:20px;">
                    ${u.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${u.fechaRegistro || '-'}</td>
            <td>${u.ultimoLogin   || '-'}</td>
            <td>
                <button class="btn-action edit-btn" onclick="abrirEditarUsuario(${u.id})">✏️ Editar</button>
                <button class="btn-action btn-del"  onclick="eliminarUsuario(${u.id})">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}
 
// Crear usuario (desde modal "Registrar Usuario")
async function crearUsuario() {
    const nombre = document.getElementById('nu-nombre').value.trim();
    const correo = document.getElementById('nu-correo').value.trim();
    const edad   = parseInt(document.getElementById('nu-edad').value) || 0;
    const rol    = document.getElementById('nu-rol').value;
 
    if (!nombre || !correo) {
        alert('Por favor completa nombre y correo.');
        return;
    }
 
    const nuevo = {
        id:            Date.now(),
        nombre, correo, edad, rol,
        estado:        true,
        fechaRegistro: new Date().toLocaleDateString('es-CO'),
        ultimoLogin:   '-'
    };
 
    try {
        const res = await fetch(API_USUARIOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email: correo, edad, rol, password: 'default123' })
        });
        if (res.ok) {
            const creado = await res.json();
            nuevo.id = creado.id;
        }
    } catch {}
 
    const lista = obtenerUsuarios();
    const yaExiste = lista.some(u => u.correo === correo);
    if (yaExiste) {
        alert('Ya existe un usuario con ese correo.');
        return;
    }
    lista.push(nuevo);
    guardarUsuariosLocal(lista);
 
    document.getElementById('modal-user-toggle').checked = false;
    limpiarFormUsuario();
    renderUsuarios();
    renderDashboard();
}
 
function limpiarFormUsuario() {
    ['nu-nombre','nu-correo','nu-edad'].forEach(id => {
        document.getElementById(id).value = '';
    });
}
 
// Abrir modal editar usuario
function abrirEditarUsuario(id) {
    const usuarios = obtenerUsuarios();
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
 
    editandoUsuarioId = id;
    document.getElementById('eu-nombre').value = u.nombre;
    document.getElementById('eu-correo').value = u.correo;
    document.getElementById('eu-edad').value   = u.edad || '';
    document.getElementById('eu-rol').value    = u.rol;
    abrirModal('modal-edit-usr');
}
 
// Guardar edición de usuario
async function guardarUsuario() {
    const id     = editandoUsuarioId;
    const nombre = document.getElementById('eu-nombre').value.trim();
    const correo = document.getElementById('eu-correo').value.trim();
    const edad   = parseInt(document.getElementById('eu-edad').value) || 0;
    const rol    = document.getElementById('eu-rol').value;
 
    if (!nombre || !correo) {
        alert('Completa nombre y correo.');
        return;
    }
 
    try {
        await fetch(API_USUARIOS + '/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email: correo, edad, rol, password: 'default123' })
        });
    } catch {}
 
    const lista = obtenerUsuarios();
    const idx   = lista.findIndex(x => x.id === id);
    if (idx !== -1) {
        lista[idx] = { ...lista[idx], nombre, correo, edad, rol };
    }
    guardarUsuariosLocal(lista);
 
    cerrarModal('modal-edit-usr');
    renderUsuarios();
    renderDashboard();
}
 
async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
        await fetch(API_USUARIOS + '/' + id, { method: 'DELETE' });
    } catch {}
    const lista = obtenerUsuarios().filter(u => u.id !== id);
    guardarUsuariosLocal(lista);
    renderUsuarios();
    renderDashboard();
}