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
  setupDropdownListener();
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

    const userRole = (user.rol || '').toUpperCase();
    const isAdmin = userRole === 'ADMINISTRADOR' || userRole === 'ALMACENERO';

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

// 3. Listener para Menú Desplegable de Categorías
function setupDropdownListener() {
  const btn = document.getElementById('btnCategoryDropdown');
  const menu = document.getElementById('categoryDropdownMenu');

  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
  }
}

// 4. Cargar Categorías en Dropdown y Accesos Directos
async function loadCategories() {
  const menu = document.getElementById('categoryDropdownMenu');
  const quick = document.getElementById('quickCategories');

  try {
    const res = await fetch('/api/products/categories');
    const data = await res.json();

    if (data.success && data.data) {
      const categories = data.data;

      // Menú desplegable completo (Organizado sin scroll bar)
      if (menu) {
        menu.innerHTML = `
          <button class="category-dropdown-item active" data-category="all" onclick="filterByCategory('all', this, true)">
            Todos los Productos
          </button>
          ${categories.map(cat => `
            <button class="category-dropdown-item" data-category="${cat.id}" onclick="filterByCategory(${cat.id}, this, true)">
              ${cat.nombre}
            </button>
          `).join('')}
        `;
      }

      // Accesos directos limpios (Flex sin scrollbar)
      if (quick) {
        const topCats = categories.slice(0, 5);
        quick.innerHTML = `
          <button class="subnav-link active" data-category="all" onclick="filterByCategory('all', this)">Todos</button>
          ${topCats.map(cat => `
            <button class="subnav-link" data-category="${cat.id}" onclick="filterByCategory(${cat.id}, this)">${cat.nombre}</button>
          `).join('')}
        `;
      }
    }
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// 5. Filtrar por Categoría
window.filterByCategory = function(catId, btnElement, fromDropdown = false) {
  currentCategory = catId;
  
  if (fromDropdown) {
    document.getElementById('categoryDropdownMenu')?.classList.remove('show');
  }

  // Sincronizar estado activo en todos los botones
  document.querySelectorAll('.subnav-link, .category-dropdown-item').forEach(btn => {
    if (btn.getAttribute('data-category') == catId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const searchVal = document.getElementById('searchInput')?.value || '';
  loadProducts(currentCategory, searchVal);
};

// 6. Cargar Productos desde API
async function loadProducts(catId = currentCategory, search = '') {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCount');
  const heroBanner = document.getElementById('heroBanner');
  if (!grid) return;

  // El Hero Banner sólo se muestra en la vista inicial (sin filtros ni búsqueda activa)
  if (heroBanner) {
    if (catId !== 'all' || (search && search.trim() !== '')) {
      heroBanner.style.display = 'none';
    } else {
      heroBanner.style.display = 'block';
    }
  }

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Cargando catálogo...</div>';

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
          ? `<span class="stock-tag low-stock">Últimas ${product.stock} unids</span>`
          : `<span class="stock-tag in-stock">Stock: ${product.stock} unids</span>`;

      const formattedPrice = parseFloat(product.precio).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const ratingVal = (4.7 + ((product.id || 1) % 4) * 0.1).toFixed(1);
      const reviewsCount = 12 + ((product.id || 1) * 7) % 35;

      return `
        <article class="product-card" data-product-id="${product.id}">
          <div class="product-img-wrapper">
            <span class="category-tag">${product.categoria_nombre}</span>
            ${stockBadge}
            <img 
              src="${product.imagen_url || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80'}" 
              alt="${product.nombre}" 
              class="product-img"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80'"
            >
          </div>
          
          <div class="product-info">
            <div class="product-rating">
              <span class="stars">★★★★★</span>
              <span class="rating-score">${ratingVal}</span>
              <span class="reviews-count">(${reviewsCount})</span>
            </div>

            <h3 class="product-name" title="${product.nombre}">${product.nombre}</h3>
            <p class="product-desc" title="${product.descripcion}">${product.descripcion || 'Garantía oficial Memory Kings Perú.'}</p>
            
            <div class="product-footer">
              <div class="product-price">
                <small>S/ </small>${formattedPrice}
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
        Error al cargar los productos. Por favor verifique que el servidor esté activo.
      </div>
    `;
  }
}

// 7. Buscador con debounce
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

// 8. Notificaciones Toast Globales
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
