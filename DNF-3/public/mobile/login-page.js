// login-page.js
export default {
  name: 'LoginPage',
  data() {
    return { 
      username: '', 
      password: '',
      errorMessage: null,
      isSubmitting: false
    };
  },
  
  methods: {
    async login() {
      if (!this.username.trim() || !this.password.trim()) {
        this.errorMessage = 'Please enter both username and password.';
        return;
      }

      this.errorMessage = null;
      this.isSubmitting = true;

      try {
        const response = await fetch('/cpad-project/DNF-3/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username.trim(),
            password: this.password
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Set browser cookies to persist session state
          document.cookie = `username=${encodeURIComponent(data.username)}; path=/; max-age=3600`;
          document.cookie = `role=${encodeURIComponent(data.role)}; path=/; max-age=3600`;
          document.cookie = `user_id=${encodeURIComponent(data.user_id)}; path=/; max-age=3600`;
          
          console.log("Logged in successfully as role:", data.role);
          this.$emit('auth-user', data);
        } else {
          this.errorMessage = data.error || 'Invalid credentials. Please try again.';
        }
      } catch (err) {
        console.error("Login request error:", err);
        this.errorMessage = 'Network connection failure. Please try again.';
      } finally {
        this.isSubmitting = false;
      }
    }
  },
  
  template: `
    <div class="card shadow-sm p-4 my-3 bg-white border-0 rounded-3">
      <div class="text-center mb-4">
        <h3 class="font-weight-bold" style="color: #800020;">Member Access</h3>
        <p class="text-muted small">Online Food & Drink Ordering System</p>
      </div>
      
      <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show font-weight-bold small py-2 mb-3" role="alert">
        {{ errorMessage }}
        <button type="button" class="btn-close py-2" @click="errorMessage = null" aria-label="Close"></button>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-weight-bold text-muted small">Username</label>
        <input type="text" class="form-control form-control-lg" v-model="username" placeholder="Enter username" :disabled="isSubmitting" @keyup.enter="login">
      </div>

      <div class="form-group mb-4">
        <label class="form-label font-weight-bold text-muted small">Password</label>
        <input type="password" class="form-control form-control-lg" v-model="password" placeholder="Enter password" :disabled="isSubmitting" @keyup.enter="login">
      </div>

      <div class="form-group mb-2">
        <button class="btn btn-lg w-100 font-weight-bold text-white shadow-sm" style="background-color: #800020;" @click="login()" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ isSubmitting ? 'Authenticating...' : 'Sign In' }}
        </button>
      </div>
    </div>
  `
};
