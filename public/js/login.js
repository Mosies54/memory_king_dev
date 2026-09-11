/**
 * Login Controller - Memory Kings Perú S.A.C.
 * Vanilla JavaScript con Fetch API
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const btnLogin = document.getElementById('btnLogin');
  const loginAlert = document.getElementById('loginAlert');

  // Verificar si ya hay una sesión activa
  const currentUser = JSON.parse(localStorage.getItem('mk_user'));
  if (currentUser) {
    if (currentUser.rol === 'ADMINISTRADOR' || currentUser.rol === 'ALMACENERO') {
      window.location.href = '/admin.html';
      return;
    }
  }

  // Manejador del formulario de inicio de sesión
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert('Por favor ingrese todos los campos.', 'error');
      return;
    }

    try {
      btnLogin.disabled = true;
      btnLogin.textContent = 'Verificando credenciales...';
      hideAlert();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al autenticar.');
      }

      // Guardar usuario en localStorage
      const user = data.data.user;
      localStorage.setItem('mk_user', JSON.stringify(user));

      showAlert(`¡Bienvenido, ${user.nombre}! Redirigiendo...`, 'success');

      // Redirección condicionada por Rol
      setTimeout(() => {
        if (user.rol === 'ADMINISTRADOR' || user.rol === 'ALMACENERO') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/index.html';
        }
      }, 1000);

    } catch (err) {
      showAlert(err.message, 'error');
      btnLogin.disabled = false;
      btnLogin.textContent = 'Ingresar al Sistema';
    }
  });

  function showAlert(message, type) {
    loginAlert.style.display = 'block';
    loginAlert.textContent = message;
    if (type === 'success') {
      loginAlert.style.backgroundColor = 'var(--primary-light)';
      loginAlert.style.color = 'var(--primary-dark)';
      loginAlert.style.border = '1px solid var(--primary-medium)';
      loginAlert.style.fontWeight = '600';
    } else {
      loginAlert.style.backgroundColor = '#ffe4e6';
      loginAlert.style.color = 'var(--accent-red)';
      loginAlert.style.border = '1px solid #fecdd3';
      loginAlert.style.fontWeight = '600';
    }
  }

  function hideAlert() {
    loginAlert.style.display = 'none';
  }
});
