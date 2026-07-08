/**
 * RentEase API Client
 * Handles all HTTP requests to the backend server
 */

const API_BASE = window.location.origin + '/api';

const API = {
  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if provided
    if (options.token) {
      config.headers['Authorization'] = `Bearer ${options.token}`;
      delete config.token;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },

  // ===== Auth Endpoints =====

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getProfile(token) {
    return this.request('/auth/me', {
      token,
    });
  },

  // ===== Product Endpoints =====

  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/products${queryString ? '?' + queryString : ''}`;
    return this.request(endpoint);
  },

  async getProduct(id) {
    return this.request(`/products/${id}`);
  },

  async getCategories() {
    return this.request('/products/categories');
  },

  async createProduct(productData, token) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
      token,
    });
  },

  async updateProduct(id, productData, token) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
      token,
    });
  },

  async deleteProduct(id, token) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  async seedProducts() {
    return this.request('/products/seed', {
      method: 'POST',
    });
  },

  // ===== Order Endpoints =====

  async createOrder(orderData, token) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
      token,
    });
  },

  async getMyOrders(token) {
    return this.request('/orders/my-orders', {
      token,
    });
  },

  async getOrder(id, token) {
    return this.request(`/orders/${id}`, {
      token,
    });
  },

  async getAllOrders(params = {}, token) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/orders${queryString ? '?' + queryString : ''}`;
    return this.request(endpoint, {
      token,
    });
  },

  async updateOrderStatus(id, status, token) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      token,
    });
  },

  async raiseMaintenanceTicket(orderId, data, token) {
    return this.request(`/orders/${orderId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  },

  async updateMaintenanceTicket(orderId, ticketId, data, token) {
    return this.request(`/orders/${orderId}/maintenance/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
};
