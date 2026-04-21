class AuthManager {
  static isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '#login';
    location.reload();
  }

  static getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}