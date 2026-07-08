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

  // Seed products if needed (fire and forget)
  API.seedProducts().catch(() => {});
});

// ============================================================
// Navbar Scroll Effect
// ============================================================

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ============================================================
// Mobile Menu
// ============================================================

function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('open');
}

// Close mobile menu when clicking a link
document.addEventListener('click', (e) => {
  if (e.target.closest('.nav-links a')) {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('open');
  }
});

// ============================================================
// Authentication State Management
// ============================================================

function getStoredUser() {
  try {
    const userData = localStorage.getItem('rentease_user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
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
    if (authBtn) authBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName) userName.textContent = user.name.split(' ')[0];
  } else {
    if (authBtn) authBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  }
}

// ============================================================
// Auth Modal
// ============================================================

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('active');
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
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabs[0].classList.add('active');
    title.textContent = 'Welcome Back';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabs[1].classList.add('active');
    title.textContent = 'Create Account';
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
  // Redirect to home if on protected page
  if (window.location.pathname === '/cart') {
    // Don't redirect, just clear auth
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

// ============================================================
// Cart Management (localStorage based)
// ============================================================

function getCart() {
  try {
    const cart = localStorage.getItem('rentease_cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('rentease_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();
  const badges = document.querySelectorAll('#cartBadge');
  badges.forEach(badge => {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'flex' : 'none';
  });
}

function addToCart(productId) {
  // Quick add from catalog - requires fetching product details
  // For now, redirect to product page
  window.location.href = `/product?id=${productId}`;
}

function addToCartDirect(item) {
  const cart = getCart();

  // Check if product already in cart
  const existingIdx = cart.findIndex(c => c.productId === item.productId);
  if (existingIdx >= 0) {
    // Update tenure if different
    cart[existingIdx].tenure = item.tenure;
    cart[existingIdx].monthlyRent = item.monthlyRent;
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
    tenure: 12, // Default to 12 months
    monthlyRent,
    deposit,
    quantity: 1,
  };

  addToCartDirect(cartItem);
  showToast('Added to cart! Visit cart to configure tenure.', 'success');
}

// ============================================================
// Star Rating Utility
// ============================================================

function getStarRating(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '½';
  for (let i = 0; i < empty; i++) stars += '☆';
  return stars;
}

// ============================================================
// Toast Notifications
// ============================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.success}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// ============================================================
// Format Currency
// ============================================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// Date Formatting
// ============================================================

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================
// Debounce Utility
// ============================================================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
