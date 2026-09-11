/**
 * Admin / ERP Controller - Memory Kings Perú S.A.C.
 * Vanilla JavaScript con Fetch API
 */

let inventoryCache = [];
let ordersCache = [];
let categoriesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  verifyAdminAuth();
  loadCategories();
  loadInventory();
  loadOrders();
  setupProductForm();
  setupInventorySearch();
});

// 1. Verificación de Seguridad y Sesión
function verifyAdminAuth() {
  const user = JSON.parse(localStorage.getItem('mk_user'));

  if (!user || (user.rol !== 'ADMINISTRADOR' && user.rol !== 'ALMACENERO')) {
    alert('Acceso Restringido. Debe iniciar sesión con una cuenta de Administrador o Almacenero.');
    window.location.href = '/login.html';
    return;
  }

  const greeting = document.getElementById('adminGreeting');
  if (greeting) {
    greeting.textContent = `${user.nombre} (${user.rol})`;
  }
}

// 2. Cerrar sesión
window.adminLogout = function() {
  localStorage.removeItem('mk_user');
  window.location.href = '/login.html';
};

// 3. Cambio de Pestañas
window.switchAdminTab = function(tabName, btnElement) {
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));

  if (btnElement) btnElement.classList.add('active');
  const targetSection = document.getElementById(`tab-${tabName}`);
  if (targetSection) targetSection.classList.add('active');

  if (tabName === 'inventario') loadInventory();
  if (tabName === 'pedidos') loadOrders();
};

// 4. Cargar Categorías para el Formulario
async function loadCategories() {
  try {
    const res = await fetch('/api/products/categories');
    const data = await res.json();
    if (data.success) {
      categoriesCache = data.data;
      const select = document.getElementById('prodCategoria');
      if (select) {
        select.innerHTML = '<option value="">Seleccione una categoría...</option>' + 
          data.data.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Error cargando categorías:', err);
  }
}

// ==========================================================================
// GESTIÓN DE INVENTARIO
// ==========================================================================

// 5. Cargar Inventario desde la BD
async function loadInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  const countEl = document.getElementById('adminInventoryCount');
  if (!tbody) return;

  try {
    const res = await fetch('/api/products?solo_activos=false');
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    inventoryCache = data.data;
    if (countEl) countEl.textContent = `${inventoryCache.length} productos en catálogo`;

    renderInventoryTable(inventoryCache);
  } catch (err) {
    console.error('Error al cargar inventario:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger); text-align:center; padding:20px;">Error al conectar con la base de datos.</td></tr>`;
  }
}

// Renderizar tabla de inventario
function renderInventoryTable(products) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-secondary);">No se encontraron productos en el inventario.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const stockClass = p.stock <= 0 ? 'color: var(--accent-red); font-weight: bold;' : p.stock < 5 ? 'color: var(--status-warning); font-weight: bold;' : 'font-weight: bold;';
    const statusBadge = p.activo 
      ? `<span class="badge" style="background:var(--primary-light); color:var(--primary-dark); border:1px solid var(--primary-medium);">Activo</span>`
      : `<span class="badge" style="background:#ffe4e6; color:var(--accent-red); border:1px solid #fecdd3;">Inactivo</span>`;

    return `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td>
          <img src="${p.imagen_url || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=60'}" 
               alt="${p.nombre}" 
               style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; background: #f1f5f9;"
               onerror="this.src='https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=60'">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); max-width: 260px;">${p.nombre}</div>
          <small style="color: var(--text-muted);">${p.descripcion ? p.descripcion.substring(0, 45) + '...' : ''}</small>
        </td>
        <td><span class="badge" style="background: #e2e8f0; color: #334155;">${p.categoria_nombre}</span></td>
        <td><strong>S/ ${parseFloat(p.precio).toFixed(2)}</strong></td>
        <td style="${stockClass}">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${p.stock} unids</span>
            <button class="btn-sm btn-secondary" style="padding: 2px 6px; font-size: 0.75rem;" title="Modificar Stock Rápido" onclick="quickStockEdit(${p.id}, ${p.stock})">Stock</button>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-sm btn-secondary" onclick="openEditProductModal(${p.id})">Editar</button>
            ${p.activo ? `<button class="btn-sm" style="background:#ffe4e6; color:var(--accent-red); border:1px solid #fecdd3;" onclick="deactivateProduct(${p.id})">Desactivar</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Búsqueda en tabla de inventario
function setupInventorySearch() {
  const searchInput = document.getElementById('adminProductSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = inventoryCache.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      p.categoria_nombre.toLowerCase().includes(term) ||
      p.id.toString().includes(term)
    );
    renderInventoryTable(filtered);
  });
}

// Modal Registrar / Editar Producto
window.openNewProductModal = function() {
  document.getElementById('editProductId').value = '';
  document.getElementById('productModalTitle').textContent = 'Registrar Producto en Inventario';
  document.getElementById('productForm').reset();
  document.getElementById('productModal').classList.add('active');
};

window.openEditProductModal = function(productId) {
  const prod = inventoryCache.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('editProductId').value = prod.id;
  document.getElementById('productModalTitle').textContent = `Editar Producto #${prod.id}`;
  document.getElementById('prodNombre').value = prod.nombre;
  document.getElementById('prodCategoria').value = prod.categoria_id;
  document.getElementById('prodPrecio').value = prod.precio;
  document.getElementById('prodStock').value = prod.stock;
  document.getElementById('prodImagenUrl').value = prod.imagen_url || '';
  document.getElementById('prodDescripcion').value = prod.descripcion || '';

  document.getElementById('productModal').classList.add('active');
};

window.closeProductModal = function() {
  document.getElementById('productModal').classList.remove('active');
};

// Guardar Producto (POST o PUT)
function setupProductForm() {
  const form = document.getElementById('productForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editProductId').value;
    const nombre = document.getElementById('prodNombre').value.trim();
    const categoria_id = document.getElementById('prodCategoria').value;
    const precio = document.getElementById('prodPrecio').value;
    const stock = document.getElementById('prodStock').value;
    const imagen_url = document.getElementById('prodImagenUrl').value.trim();
    const descripcion = document.getElementById('prodDescripcion').value.trim();

    const isEdit = Boolean(id);
    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    const btn = document.getElementById('btnSaveProduct');

    try {
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          categoria_id,
          precio,
          stock,
          imagen_url,
          descripcion,
          activo: true
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al guardar');

      showToast(isEdit ? 'Producto actualizado con éxito' : 'Producto registrado en inventario', 'success');
      closeProductModal();
      loadInventory();

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar en Base de Datos';
    }
  });
}

// Edición rápida de stock
window.quickStockEdit = async function(productId, currentStock) {
  const newStockStr = prompt(`Ingrese el nuevo stock para el producto #${productId}:`, currentStock);
  if (newStockStr === null) return;

  const newStock = parseInt(newStockStr, 10);
  if (isNaN(newStock) || newStock < 0) {
    alert('Por favor ingrese un número entero positivo.');
    return;
  }

  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showToast(`Stock actualizado a ${newStock} unids.`, 'success');
    loadInventory();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Desactivar producto
window.deactivateProduct = async function(productId) {
  if (!confirm(`¿Está seguro de desactivar el producto #${productId} del catálogo?`)) return;

  try {
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showToast('Producto desactivado', 'info');
    loadInventory();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ==========================================================================
// GESTIÓN DE PEDIDOS Y VENTAS
// ==========================================================================

// 6. Cargar Pedidos desde la BD
window.loadOrders = async function() {
  const tbody = document.getElementById('ordersTableBody');
  const filterSelect = document.getElementById('filterOrderStatus');
  const estado = filterSelect ? filterSelect.value : 'all';

  if (!tbody) return;

  try {
    let url = '/api/orders';
    if (estado && estado !== 'all') {
      url += `?estado=${estado}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    ordersCache = data.data;
    renderOrdersTable(ordersCache);

  } catch (err) {
    console.error('Error al cargar pedidos:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger); text-align:center; padding:20px;">Error al cargar pedidos.</td></tr>`;
  }
};

// Renderizar tabla de pedidos
function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-secondary);">No hay pedidos registrados con el criterio seleccionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(ord => {
    const dateFormatted = new Date(ord.fecha).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const badgeClass = {
      'PENDIENTE': 'badge-pending',
      'PAGADO': 'badge-paid',
      'ENVIADO': 'badge-shipped',
      'ENTREGADO': 'badge-delivered',
      'CANCELADO': 'badge-cancelled',
    }[ord.estado] || 'badge-pending';

    return `
      <tr>
        <td><strong>#ORD-${ord.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${ord.cliente_nombre}</div>
          <small style="color: var(--text-secondary);">${ord.cliente_email}</small>
        </td>
        <td>${ord.cliente_telefono || 'No registrado'}</td>
        <td><small>${dateFormatted}</small></td>
        <td><strong style="color: var(--primary-dark);">S/ ${parseFloat(ord.total).toFixed(2)}</strong></td>
        <td><small>${ord.metodo_pago}</small></td>
        <td>
          <select class="form-control" style="font-size: 0.8rem; padding: 4px 8px; font-weight: 700;" onchange="updateOrderStatus(${ord.id}, this.value)">
            <option value="PENDIENTE" ${ord.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
            <option value="PAGADO" ${ord.estado === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
            <option value="ENVIADO" ${ord.estado === 'ENVIADO' ? 'selected' : ''}>ENVIADO</option>
            <option value="ENTREGADO" ${ord.estado === 'ENTREGADO' ? 'selected' : ''}>ENTREGADO</option>
            <option value="CANCELADO" ${ord.estado === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
          </select>
        </td>
        <td>
          <button class="btn-sm btn-secondary" onclick="viewOrderDetail(${ord.id})">
            Ver (${ord.items ? ord.items.length : 0} items)
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Actualizar estado del pedido (PUT /api/orders/:id/status)
window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newStatus }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    showToast(data.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    loadOrders();
  }
};

// Modal de detalle de items de la orden
window.viewOrderDetail = function(orderId) {
  const order = ordersCache.find(o => o.id === orderId);
  if (!order) return;

  const content = document.getElementById('orderDetailContent');
  document.getElementById('orderDetailTitle').textContent = `Detalle del Pedido #ORD-${order.id}`;

  const itemsHtml = (order.items || []).map(item => `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
      <div>
        <strong>${item.producto_nombre}</strong>
        <div style="color: var(--text-secondary); font-size: 0.8rem;">Cantidad: ${item.cantidad} unids x S/ ${parseFloat(item.precio_unitario).toFixed(2)}</div>
      </div>
      <div style="font-weight: 700; color: var(--primary-brand);">
        S/ ${(item.cantidad * item.precio_unitario).toFixed(2)}
      </div>
    </div>
  `).join('');

  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <p><strong>Cliente:</strong> ${order.cliente_nombre} (${order.cliente_email})</p>
      <p><strong>Dirección de Entrega:</strong> ${order.direccion_envio}</p>
      <p><strong>Método de Pago:</strong> ${order.metodo_pago}</p>
      <p><strong>Estado:</strong> <span class="badge badge-${order.estado.toLowerCase()}">${order.estado}</span></p>
    </div>
    <h4 style="margin-bottom: 10px; color: var(--primary-dark);">Productos Adquiridos:</h4>
    <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
      ${itemsHtml}
    </div>
    <div style="text-align: right; font-size: 1.2rem; font-weight: 800; color: var(--primary-dark);">
      Total: S/ ${parseFloat(order.total).toFixed(2)}
    </div>
  `;

  document.getElementById('orderDetailModal').classList.add('active');
};

window.closeOrderDetailModal = function() {
  document.getElementById('orderDetailModal').classList.remove('active');
};

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:transparent; color:#fff; border:none; margin-left:10px; font-weight:bold; cursor:pointer;" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
