class API {
  static async request(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  static signup(username, email, password, confirmPassword) {
    return this.request('/auth/signup', 'POST', {
      username,
      email,
      password,
      confirmPassword,
    });
  }

  static login(email, password) {
    return this.request('/auth/login', 'POST', { email, password });
  }

  static getMe() {
    return this.request('/auth/me');
  }

  // File endpoints
  static uploadFile(name, data, type) {
    return this.request('/files/upload', 'POST', { name, data, type });
  }

  static getMyFiles() {
    return this.request('/files/my-files');
  }

  static getSharedFiles() {
    return this.request('/files/shared');
  }

  static getRecentFiles() {
    return this.request('/files/recent');
  }

  static getFile(id) {
    return this.request(`/files/${id}`);
  }

  static shareFile(fileId, email) {
    return this.request('/files/share', 'POST', { fileId, email });
  }

  static deleteFile(id) {
    return this.request(`/files/${id}`, 'DELETE');
  }

  static togglePublic(id) {
    return this.request(`/files/${id}/toggle-public`, 'POST');
  }

  static getStorageUsage() {
    return this.request('/files/storage/usage');
  }
}