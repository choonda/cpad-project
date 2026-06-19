// login-page.js
export default {
  name: 'LoginPage',
  data() {
    return { 
      username: '', password: '',
      localusers: [
        {  id:1, username: 'cash01', password:'cashPass', name:'Ahmad', email:'ahmad@gmail.com', phone:'017-6543322', role:'Cashier' },
        {  id:2, username: 'elena@gmail.com', password:'012-3456677', name:'Elena', email:'elena@gmail.com', phone:'012-3456677', role:'Customer' },
        
      ],
    };
  },
  
  methods: {
    login() {
      for (const user of this.localusers) {
        if (this.username == user.username && 
            this.password == user.password) {
          console.log("Valid user");
          this.$emit('auth-user', user);
          break;
          
        } else {
          console.log("Invalid user");
        }
      }
    }, // end of login
  },
  
  template: `
    <h2>Login</h2>
    <p>
    <input type="text" class="w3-input w3-border w3-round"  v-model="username" placeholder="Username"></p>
    <p>
    <input type="password" class="w3-input w3-border w3-round-large"  v-model="password" placeholder="Password"></p>
    <button @click="login()">Submit</button>
  `
};
