/**
 * RentEase Main JavaScript
 * Handles UI state, authentication, cart management, and shared utilities
 */

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  checkAuthState();
  initNavbarScroll();

  // Seed products (backend call, silently fails in static preview)
  API.seedProducts().catch(() => {});
});

// ============================================================
// Navbar Scroll Effect
// ============================================================

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });
}

// ============================================================
// Mobile Menu
// ============================================================

function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (e.target.closest('.nav-links a')) {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('open');
  }
});

// ============================================================
// Auth State
// ============================================================

function getStoredUser() {
  try {
    const data = localStorage.getItem('rentease_user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function setStoredUser(user) {
  localStorage.setItem('rentease_user', JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem('rentease_user');
}

function checkAuthState() {
  const user = getStoredUser();
  const authBtn = document.getElementById('authBtn');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');

  if (user && user.token) {
    if (authBtn) {
      authBtn.classList.add('hidden');
      authBtn.setAttribute('style', 'display:none !important');
    }
    if (userMenu) {
      userMenu.classList.remove('hidden');
      userMenu.setAttribute('style', 'display:flex !important; align-items:center; gap:8px;');
    }
    if (userName) {
      const displayName = (user.name || 'User').split(' ')[0];
      userName.textContent = displayName;
      const menuBtn = document.getElementById('userMenuBtn');
      if (menuBtn) {
        menuBtn.onclick = () => {
          window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        };
        menuBtn.style.cursor = 'pointer';
      }
    }
  } else {
    if (authBtn) {
      authBtn.classList.remove('hidden');
      authBtn.removeAttribute('style');
    }
    if (userMenu) {
      userMenu.classList.add('hidden');
      userMenu.setAttribute('style', 'display:none !important;align-items:center;gap:8px;');
    }
  }
}

// ============================================================
// Auth Modal
// ============================================================

function openAuthModal() {
  // If on a page that has an auth modal, use it; otherwise redirect to login page
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    window.location.href = 'login.html';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');
  const title = document.getElementById('authModalTitle');

  tabs.forEach(t => t.classList.remove('active'));
  if (tab === 'login') {
    if (loginForm) loginForm.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (tabs[0]) tabs[0].classList.add('active');
    if (title) title.textContent = 'Welcome Back';
  } else {
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.remove('hidden');
    if (tabs[1]) tabs[1].classList.add('active');
    if (title) title.textContent = 'Create Account';
  }
}

// ============================================================
// Auth Handlers
// ============================================================

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span> Signing in...';

  try {
    const data = await API.login({ email, password });
    setStoredUser(data);
    checkAuthState();
    closeAuthModal();
    showToast(`Welcome back, ${data.name}!`, 'success');
    document.getElementById('loginForm').reset();
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('registerBtn');

  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span> Creating account...';

  try {
    const data = await API.register({ name, email, phone, password });
    setStoredUser(data);
    checkAuthState();
    closeAuthModal();
    showToast(`Welcome to RentEase, ${data.name}!`, 'success');
    document.getElementById('registerForm').reset();
  } catch (err) {
    showToast(err.message || 'Registration failed', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function logout() {
  clearStoredUser();
  checkAuthState();
  showToast('Logged out successfully', 'info');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

// ============================================================
// Cart Management
// ============================================================

function getCart() {
  try {
    const cart = localStorage.getItem('rentease_cart');
    return cart ? JSON.parse(cart) : [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('rentease_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();
  document.querySelectorAll('#cartBadge').forEach(badge => {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'flex' : 'none';
  });
}

function addToCart(productId) {
  window.location.href = `/product?id=${productId}`;
}

function addToCartDirect(item) {
  const cart = getCart();
  const existingIdx = cart.findIndex(c => c.productId === item.productId);
  if (existingIdx >= 0) {
    cart[existingIdx].tenure = item.tenure;
    cart[existingIdx].monthlyRent = item.monthlyRent;
    cart[existingIdx].deposit = item.deposit;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  updateCartBadge();
}

function quickAddToCart(productId, name, image, monthlyRent, deposit) {
  const cartItem = {
    productId,
    name: name.replace(/\\'/g, "'"),
    image: image.replace(/\\'/g, "'"),
    category: '',
    tenure: 12,
    monthlyRent,
    deposit,
    quantity: 1,
  };
  addToCartDirect(cartItem);
  showToast('Added to cart! Visit cart to configure tenure.', 'success');
}

// ============================================================
// Utilities
// ============================================================

function getStarRating(rating) {
  const full = Math.floor(rating);
  const half = (rating % 1) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '½';
  for (let i = 0; i < empty; i++) stars += '☆';
  return stars;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) {
    // Create container if missing
    const c = document.createElement('div');
    c.className = 'toast-container';
    c.id = 'toastContainer';
    document.body.appendChild(c);
    return showToast(message, type);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.success}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
