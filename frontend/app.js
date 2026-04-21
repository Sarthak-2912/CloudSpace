class CloudSpaceApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.files = [];
    this.init();
  }

  init() {
    if (!AuthManager.isLoggedIn()) {
      this.showLoginPage();
    } else {
      this.setupUI();
      this.loadDashboard();
    }
  }

  showLoginPage() {
    document.getElementById('app').innerHTML = `
      <div class="auth-container">
        <div class="auth-box">
          <div class="logo">☁️</div>
          <h1>CloudSpace</h1>
          <div class="auth-tabs">
            <button id="tab-login" class="tab-btn active" onclick="app.switchTab('login')">Login</button>
            <button id="tab-signup" class="tab-btn" onclick="app.switchTab('signup')">Sign Up</button>
          </div>

          <form id="login-form" class="auth-form active">
            <h2>Welcome back</h2>
            <input type="email" id="login-email" placeholder="Email" required>
            <input type="password" id="login-password" placeholder="Password" required>
            <button type="submit" class="btn-primary">Sign In</button>
            <p id="login-error" class="error-msg"></p>
          </form>

          <form id="signup-form" class="auth-form">
            <h2>Create account</h2>
            <input type="text" id="signup-username" placeholder="Username" required>
            <input type="email" id="signup-email" placeholder="Email" required>
            <input type="password" id="signup-password" placeholder="Password (min 6 chars)" required>
            <input type="password" id="signup-confirm" placeholder="Confirm Password" required>
            <button type="submit" class="btn-primary">Create Account</button>
            <p id="signup-error" class="error-msg"></p>
          </form>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));
  }

  switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await API.login(email, password);
      AuthManager.setToken(response.token);
      AuthManager.setUser(response.user);
      this.setupUI();
      this.loadDashboard();
    } catch (error) {
      document.getElementById('login-error').textContent = error.message;
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    try {
      const response = await API.signup(username, email, password, confirmPassword);
      AuthManager.setToken(response.token);
      AuthManager.setUser(response.user);
      this.setupUI();
      this.loadDashboard();
    } catch (error) {
      document.getElementById('signup-error').textContent = error.message;
    }
  }

  setupUI() {
    const user = AuthManager.getUser();
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="logo">☁️</div>
            <h1>CloudSpace</h1>
          </div>

          <nav class="nav-menu">
            <button class="nav-btn active" data-page="dashboard" onclick="app.navigateTo('dashboard')">
              📊 Dashboard
            </button>
            <button class="nav-btn" data-page="my-files" onclick="app.navigateTo('my-files')">
              📁 My Files
            </button>
            <button class="nav-btn" data-page="shared" onclick="app.navigateTo('shared')">
              🔗 Shared
            </button>
          </nav>

          <div class="storage-info">
            <div class="storage-header">
              <span>Storage</span>
              <span id="storage-percent">0%</span>
            </div>
            <div class="storage-bar">
              <div id="storage-used" class="storage-progress"></div>
            </div>
            <small class="storage-text" id="storage-text">0 MB / 10 MB</small>
          </div>

          <div class="user-section">
            <div class="user-info">
              <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
              <div>
                <div class="user-name">${user.username}</div>
                <small class="user-email">${user.email}</small>
              </div>
            </div>
            <button class="btn-logout" onclick="AuthManager.logout()">🚪 Logout</button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="header">
            <h2 id="page-title">Dashboard</h2>
            <label class="upload-btn">
              📤 Upload File
              <input type="file" id="file-input" onchange="app.handleFileUpload(event)" style="display: none;">
            </label>
          </div>

          <div id="content" class="content-area">
            <!-- Dynamic content goes here -->
          </div>
        </main>
      </div>

      <!-- Share Modal -->
      <div id="share-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Share File</h3>
            <button class="modal-close" onclick="document.getElementById('share-modal').style.display='none'">&times;</button>
          </div>
          <form id="share-form" onsubmit="app.handleShare(event)">
            <input type="email" id="share-email" placeholder="Enter email to share with" required>
            <input type="hidden" id="share-file-id">
            <button type="submit" class="btn-primary">Share</button>
            <p id="share-error" class="error-msg"></p>
          </form>
        </div>
      </div>

      <!-- File Preview Modal -->
      <div id="preview-modal" class="preview-modal" style="display: none;" onclick="app.closePreview(event)">
        <div class="preview-container" onclick="event.stopPropagation()">
          <div class="preview-header">
            <h3 id="preview-title">File Preview</h3>
            <button class="preview-close" onclick="app.closePreview()">&times;</button>
          </div>
          <div class="preview-body">
            <div id="preview-content" class="preview-content"></div>
          </div>
          <div class="preview-footer">
            <button class="preview-btn" onclick="app.downloadFromPreview()">⬇️ Download</button>
            <button class="preview-btn" onclick="app.closePreview()">❌ Close</button>
          </div>
        </div>
      </div>
    `;

    this.updateStorage();
    setInterval(() => this.updateStorage(), 5000);
  }

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    switch (page) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'my-files':
        this.loadMyFiles();
        break;
      case 'shared':
        this.loadSharedFiles();
        break;
    }
  }

  async loadDashboard() {
    document.getElementById('page-title').textContent = 'Dashboard';
    const content = document.getElementById('content');
    content.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const data = await API.getRecentFiles();
      let html = '';

      if (data.myFiles.length > 0) {
        html += '<h3 class="section-title">Your Files</h3>';
        html += '<div class="files-grid">';
        data.myFiles.forEach(file => {
          html += this.createFileCard(file, true);
        });
        html += '</div>';
      }

      if (data.sharedFiles.length > 0) {
        html += '<h3 class="section-title">Shared with You</h3>';
        html += '<div class="files-grid">';
        data.sharedFiles.forEach(file => {
          html += this.createFileCard(file, false);
        });
        html += '</div>';
      }

      if (data.myFiles.length === 0 && data.sharedFiles.length === 0) {
        html = `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p>No files yet</p>
          </div>
        `;
      }

      content.innerHTML = html;
    } catch (error) {
      content.innerHTML = `<p class="error">❌ ${error.message}</p>`;
    }
  }

  async loadMyFiles() {
    document.getElementById('page-title').textContent = 'My Files';
    const content = document.getElementById('content');
    content.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const files = await API.getMyFiles();
      let html = '';

      if (files.length > 0) {
        html = '<div class="files-grid">';
        files.forEach(file => {
          html += this.createFileCard(file, true);
        });
        html += '</div>';
      } else {
        html = `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <p>No files uploaded yet</p>
          </div>
        `;
      }

      content.innerHTML = html;
    } catch (error) {
      content.innerHTML = `<p class="error">❌ ${error.message}</p>`;
    }
  }

  async loadSharedFiles() {
    document.getElementById('page-title').textContent = 'Shared with Me';
    const content = document.getElementById('content');
    content.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const files = await API.getSharedFiles();
      let html = '';

      if (files.length > 0) {
        html = '<div class="files-grid">';
        files.forEach(file => {
          html += this.createFileCard(file, false);
        });
        html += '</div>';
      } else {
        html = `
          <div class="empty-state">
            <div class="empty-state-icon">🔗</div>
            <p>No files shared with you</p>
          </div>
        `;
      }

      content.innerHTML = html;
    } catch (error) {
      content.innerHTML = `<p class="error">❌ ${error.message}</p>`;
    }
  }

  createFileCard(file, isOwner) {
    const fileType = file.type;
    let icon = '📄';
    let isImage = false;

    if (fileType.includes('image')) {
      icon = '🖼️';
      isImage = true;
    } else if (fileType.includes('video')) icon = '🎥';
    else if (fileType.includes('audio')) icon = '🎵';
    else if (fileType.includes('pdf')) icon = '📕';
    else if (fileType.includes('zip') || fileType.includes('rar')) icon = '📦';
    else if (fileType.includes('text')) icon = '📝';

    const size = (file.size / 1024).toFixed(2);
    const date = new Date(file.createdAt).toLocaleDateString();

    let previewHTML = `<div style="font-size: 2.5rem;">${icon}</div>`;

    if (isImage && file.data) {
      previewHTML = `<img src="data:${file.type};base64,${file.data}" alt="${file.name}">`;
    }

    return `
      <div class="file-card">
        <div class="file-preview" onclick="app.openPreview('${file._id}', '${file.name.replace(/'/g, "\\'")}', '${file.type}', '${file.data ? file.data.substring(0, 50) : ''}')" style="cursor: pointer;">
          ${previewHTML}
        </div>
        <div class="file-info">
          <h4 class="file-name">${file.name}</h4>
          <div class="file-meta">${size} KB • ${date}</div>
          ${!isOwner && file.owner ? `<small class="file-owner">By ${file.owner.username}</small>` : ''}
        </div>
        <div class="file-actions">
          <button class="action-btn" title="Download" onclick="app.downloadFile('${file._id}', '${file.name.replace(/'/g, "\\'")}')">⬇️</button>
          ${isOwner ? `
            <button class="action-btn" title="Share" onclick="app.openShareModal('${file._id}')">🔗</button>
            <button class="action-btn" title="Delete" onclick="app.deleteFile('${file._id}')">🗑️</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  async openPreview(fileId, fileName, fileType, preview) {
    try {
      const file = await API.getFile(fileId);
      const modal = document.getElementById('preview-modal');
      const previewContent = document.getElementById('preview-content');
      const previewTitle = document.getElementById('preview-title');

      previewTitle.textContent = fileName;
      this.currentPreviewFile = file;

      if (fileType.includes('image')) {
        previewContent.innerHTML = `<img src="data:${fileType};base64,${file.data}" alt="${fileName}">`;
      } else if (fileType.includes('text') || fileType.includes('plain')) {
        const text = atob(file.data);
        previewContent.innerHTML = `<div class="preview-text">${text}</div>`;
      } else {
        previewContent.innerHTML = `
          <div class="preview-unsupported">
            <div class="preview-unsupported-icon">📦</div>
            <p>This file type cannot be previewed in browser</p>
          </div>
        `;
      }

      modal.style.display = 'flex';
    } catch (error) {
      alert(`Failed to open preview: ${error.message}`);
    }
  }

  closePreview(event) {
    if (event && event.target !== document.getElementById('preview-modal')) return;
    document.getElementById('preview-modal').style.display = 'none';
    this.currentPreviewFile = null;
  }

  async downloadFromPreview() {
    if (!this.currentPreviewFile) return;
    const file = this.currentPreviewFile;
    const binaryString = atob(file.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: file.type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];

      try {
        await API.uploadFile(file.name, base64, file.type);
        alert('✅ File uploaded!');
        event.target.value = '';
        this.navigateTo(this.currentPage);
      } catch (error) {
        alert(`Upload failed: ${error.message}`);
      }
    };
    reader.readAsDataURL(file);
  }

  openShareModal(fileId) {
    document.getElementById('share-file-id').value = fileId;
    document.getElementById('share-email').value = '';
    document.getElementById('share-error').textContent = '';
    document.getElementById('share-modal').style.display = 'flex';
  }

  async handleShare(event) {
    event.preventDefault();
    const fileId = document.getElementById('share-file-id').value;
    const email = document.getElementById('share-email').value;

    try {
      await API.shareFile(fileId, email);
      alert('✅ File shared!');
      document.getElementById('share-modal').style.display = 'none';
    } catch (error) {
      document.getElementById('share-error').textContent = error.message;
    }
  }

  async deleteFile(fileId) {
    if (!confirm('Delete this file?')) return;

    try {
      await API.deleteFile(fileId);
      alert('✅ File deleted!');
      this.navigateTo(this.currentPage);
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  }

  async downloadFile(fileId, fileName) {
    try {
      const file = await API.getFile(fileId);
      const binaryString = atob(file.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  }

  async updateStorage() {
    try {
      const usage = await API.getStorageUsage();
      const percent = usage.percentage.toFixed(2);
      const usedMB = (usage.used / 1024 / 1024).toFixed(2);

      document.getElementById('storage-percent').textContent = `${percent}%`;
      document.getElementById('storage-used').style.width = `${Math.min(percent, 100)}%`;
      document.getElementById('storage-text').textContent = `${usedMB} MB / 10 MB`;
    } catch (error) {
      console.error('Storage update failed:', error);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CloudSpaceApp();
});