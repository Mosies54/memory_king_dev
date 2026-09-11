/**
 * Carrito Controller - Memory Kings Perú S.A.C.
 * Vanilla JavaScript con Fetch API y localStorage
 */

const CART_STORAGE_KEY = 'mk_cart';

// Estado local del carrito
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  setupCartDrawerEvents();
  setupCheckoutModalEvents();
});

// 1. Cargar carrito desde localStorage
function loadCartFromStorage() {
  const saved = localStorage.getItem(CART_STORAGE_KEY);
  if (saved) {
    try {
      cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
  }
  renderCart();
}

// 2. Guardar en localStorage y actualizar UI
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  renderCart();
}

// 3. Agregar producto al carrito
window.handleAddToCart = function(productId) {
  const product = allProductsCache.find(p => p.id === productId);
  if (!product) {
    showToast('Producto no encontrado.', 'error');
    return;
  }

  if (product.stock <= 0) {
    showToast('Lo sentimos, este producto está agotado.', 'warning');
    return;
  }

  const existing = cart.find(item => item.id === productId);

  if (existing) {
    if (existing.cantidad + 1 > product.stock) {
      showToast(`Stock máximo disponible alcanzado (${product.stock} unids).`, 'warning');
      return;
    }
    existing.cantidad += 1;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: parseFloat(product.precio),
      imagen_url: product.imagen_url,
      stock_max: product.stock,
      cantidad: 1,
    });
  }

  saveCart();
  showToast(`¡"${product.nombre}" agregado al carrito!`, 'success');
  openCartDrawer();
};

// 4. Modificar cantidad (+ / -)
window.changeQuantity = function(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const newQty = item.cantidad + delta;

  if (newQty <= 0) {
    window.removeFromCart(productId);
    return;
  }

  if (newQty > item.stock_max) {
    showToast(`Solo disponemos de ${item.stock_max} unidades en stock.`, 'warning');
    return;
  }

  item.cantidad = newQty;
  saveCart();
};

// 5. Eliminar un item del carrito
window.removeFromCart = function(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  showToast('Producto removido del carrito.', 'info');
};

// 6. Limpiar todo el carrito
window.clearCart = function() {
  cart = [];
  saveCart();
};

// 7. Renderizar vista del Carrito
function renderCart() {
  const cartBadge = document.getElementById('cartCountBadge');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const subtotalEl = document.getElementById('cartSubtotal');
  const igvEl = document.getElementById('cartIgv');
  const totalEl = document.getElementById('cartTotal');
  const btnCheckout = document.getElementById('btnCheckout');

  const totalItems = cart.reduce((acc, curr) => acc + curr.cantidad, 0);
  if (cartBadge) cartBadge.textContent = totalItems;

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-msg">
        <p>Tu carrito de compras está vacío.</p>
        <p style="font-size: 0.8rem; margin-top: 5px;">Explora nuestro catálogo y agrega hardware de primera calidad.</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = 'S/ 0.00';
    if (igvEl) igvEl.textContent = 'S/ 0.00';
    if (totalEl) totalEl.textContent = 'S/ 0.00';
    if (btnCheckout) btnCheckout.disabled = true;
    return;
  }

  // Cálculos económicos (Precios con IGV incluido desglosado)
  const total = cart.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
  const subtotal = total / 1.18;
  const igv = total - subtotal;

  if (subtotalEl) subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
  if (igvEl) igvEl.textContent = `S/ ${igv.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `S/ ${total.toFixed(2)}`;
  if (btnCheckout) btnCheckout.disabled = false;

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.imagen_url || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=100'}" alt="${item.nombre}" class="cart-item-img">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.nombre}</h4>
        <div class="cart-item-price">S/ ${item.precio.toFixed(2)}</div>
        <div class="cart-item-controls">
          <button class="btn-qty" onclick="changeQuantity(${item.id}, -1)">-</button>
          <span class="qty-val">${item.cantidad}</span>
          <button class="btn-qty" onclick="changeQuantity(${item.id}, 1)">+</button>
          <button class="btn-remove-item" onclick="removeFromCart(${item.id})">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');
}

// 8. Eventos del Drawer
function setupCartDrawerEvents() {
  const btnOpen = document.getElementById('btnOpenCart');
  const btnClose = document.getElementById('btnCloseCart');
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');

  if (btnOpen) btnOpen.addEventListener('click', openCartDrawer);
  if (btnClose) btnClose.addEventListener('click', closeCartDrawer);
  if (overlay) overlay.addEventListener('click', closeCartDrawer);
}

function openCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.add('active');
    drawer.classList.add('active');
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.remove('active');
    drawer.classList.remove('active');
  }
}

// 9. Modal de Checkout / Envío de Pedido a /api/orders
function setupCheckoutModalEvents() {
  const btnCheckout = document.getElementById('btnCheckout');
  const modal = document.getElementById('checkoutModal');
  const btnClose = document.getElementById('btnCloseCheckout');
  const btnCancel = document.getElementById('btnCancelCheckout');
  const checkoutForm = document.getElementById('checkoutForm');

  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      const user = JSON.parse(localStorage.getItem('mk_user'));
      if (!user) {
        showToast('Debes iniciar sesión para completar tu pedido.', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1200);
        return;
      }

      closeCartDrawer();

      // Rellenar datos de usuario en el modal
      document.getElementById('orderClientName').value = `${user.nombre} (${user.rol})`;
      document.getElementById('orderClientEmail').value = user.email;
      if (user.direccion) {
        document.getElementById('orderAddress').value = user.direccion;
      }

      const total = cart.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
      document.getElementById('modalOrderTotal').textContent = `S/ ${total.toFixed(2)}`;

      modal.classList.add('active');
    });
  }

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
  if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('active'));

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const user = JSON.parse(localStorage.getItem('mk_user'));
      if (!user) {
        showToast('Sesión no válida.', 'error');
        return;
      }

      const direccion_envio = document.getElementById('orderAddress').value.trim();
      const metodo_pago = document.getElementById('orderPaymentMethod').value;
      const btnConfirm = document.getElementById('btnConfirmOrder');

      const itemsPayload = cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
      }));

      try {
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Procesando orden...';

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario_id: user.id,
            items: itemsPayload,
            direccion_envio,
            metodo_pago,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Error al procesar el pedido.');
        }

        // Éxito: Limpiar carrito y cerrar modal
        modal.classList.remove('active');
        clearCart();
        
        showToast(`¡Pedido #${data.data.pedido_id} emitido exitosamente por S/ ${data.data.total}!`, 'success');

        // Recargar productos para reflejar los nuevos stocks
        if (typeof loadProducts === 'function') {
          loadProducts();
        }

      } catch (err) {
        console.error('Error al emitir orden:', err);
        showToast(err.message, 'error');
      } finally {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Emitir Orden de Compra';
      }
    });
  }
}
