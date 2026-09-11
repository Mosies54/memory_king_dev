/**
 * Catálogo Controller - Memory Kings Perú S.A.C.
 * Vanilla JavaScript con Fetch API
 */

let currentCategory = 'all';
let searchDebounceTimer = null;
let allProductsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  setupUserNav();
  loadCategories();
  loadProducts();
  setupSearchListener();
});

// 1. Configurar barra de navegación según sesión
function setupUserNav() {
  const userNavActions = document.getElementById('userNavActions');
  const userStatusText = document.getElementById('userStatusText');
  const user = JSON.parse(localStorage.getItem('mk_user'));

  if (!userNavActions) return;

  if (user) {
    if (userStatusText) {
      userStatusText.textContent = `Hola, ${user.nombre} (${user.rol})`;
    }

    const isAdmin = user.rol === 'ADMINISTRADOR' || user.rol === 'ALMACENERO';

    userNavActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${isAdmin ? `<a href="/admin.html" class="btn-nav-action" style="background-color: var(--primary-brand); border-color: var(--primary-brand);">Panel ERP</a>` : ''}
        <button class="btn-nav-action" onclick="logoutUser()">Cerrar Sesión</button>
      </div>
    `;
  } else {
    userNavActions.innerHTML = `
      <a href="/login.html" class="btn-nav-action" id="btnLoginNav">Iniciar Sesión</a>
    `;
  }
}

// 2. Cerrar sesión
window.logoutUser = function() {
  localStorage.removeItem('mk_user');
  showToast('Sesión cerrada correctamente.', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 600);
};

// 3. Cargar Categorías
async function loadCategories() {
  const categoryNav = document.getElementById('categoryNav');
  if (!categoryNav) return;

  try {
    const res = await fetch('/api/products/categories');
    const data = await res.json();

    if (data.success && data.data) {
      const items = [
        `<button class="subnav-link active" data-category="all" onclick="filterByCategory('all', this)">Todos los Productos</button>`,
        ...data.data.map(cat => 
          `<button class="subnav-link" data-category="${cat.id}" onclick="filterByCategory(${cat.id}, this)">${cat.nombre}</button>`
        )
      ];
      categoryNav.innerHTML = items.join('');
    }
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// 4. Filtrar por Categoría
window.filterByCategory = function(catId, btnElement) {
  currentCategory = catId;
  
  // Cambiar estilo activo
  document.querySelectorAll('.subnav-link').forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  }

  const searchVal = document.getElementById('searchInput')?.value || '';
  loadProducts(currentCategory, searchVal);
};

// 5. Cargar Productos desde API
async function loadProducts(catId = currentCategory, search = '') {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCount');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Cargando catálogo actualizado...</div>';

  try {
    let url = `/api/products?solo_activos=true`;
    if (catId && catId !== 'all') {
      url += `&categoria_id=${catId}`;
    }
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Error al obtener productos.');
    }

    allProductsCache = data.data;

    if (countEl) {
      countEl.textContent = `Mostrando ${data.total} producto(s) en existencia`;
    }

    if (data.data.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 8px; border: 1px dashed var(--border-color);">
          <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No se encontraron productos disponibles</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Prueba buscando con otro término o seleccionando otra categoría.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.data.map(product => {
      const isOutOfStock = product.stock <= 0;
      const stockBadge = isOutOfStock 
        ? `<span class="stock-tag no-stock">Agotado</span>`
        : product.stock < 5 
          ? `<span class="stock-tag low-stock">¡Últimas ${product.stock} unids!</span>`
          : `<span class="stock-tag in-stock">Stock: ${product.stock}</span>`;

      return `
        <article class="product-card" data-product-id="${product.id}">
          <div class="product-img-wrapper">
            <span class="category-tag">${product.categoria_nombre}</span>
            ${stockBadge}
            <img 
              src="${product.imagen_url || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=60'}" 
              alt="${product.nombre}" 
              class="product-img"
              onerror="this.src='https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=60'"
            >
          </div>
          
          <div class="product-info">
            <h3 class="product-name" title="${product.nombre}">${product.nombre}</h3>
            <p class="product-desc" title="${product.descripcion}">${product.descripcion || 'Garantía oficial Memory Kings Perú.'}</p>
            
            <div class="product-footer">
              <div class="product-price">
                <small>S/ </small>${parseFloat(product.precio).toFixed(2)}
              </div>
              
              <button 
                class="btn-add-cart" 
                onclick="handleAddToCart(${product.id})"
                ${isOutOfStock ? 'disabled' : ''}
              >
                ${isOutOfStock ? 'Sin Stock' : 'Agregar'}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('Error cargando catálogo:', err);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">
        Error al cargar los productos. Por favor verifique que la base de datos PostgreSQL esté activa.
      </div>
    `;
  }
}

// 6. Buscador con debounce
function setupSearchListener() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadProducts(currentCategory, e.target.value);
    }, 300);
  });
}

// 7. Notificaciones Toast Globales
window.showToast = function(message, type = 'info') {
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

  setTimeout(() => {
    toast.remove();
  }, 3500);
};
