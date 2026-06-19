// order-page.js
export default {
  name: 'OrderPage',
  props: ['orderlist', 'subtotal', 'user'],
  
  data() {
    if (this.user.id) { // user login into the system
      return { custInfoDisable: true };
    } else {
      return { custInfoDisable: false };
    }
  },
  
  methods: {
    confirm() {
      alert("Save the following JSON order info: \n" + 
            JSON.stringify(this.user, null, 2) + "\n" + JSON.stringify(this.orderlist));
      
      //refresh order related data
      this.$emit('reset-order');
    }, // end of confirm
    
    cancel() {
      //refresh order related data
      this.$emit('reset-order');
    }, // end of cancel
  },
  
  template: `
    <h2>Order</h2>
    <h3>Customer Information</h3>
    <p>
    <input class="w3-input w3-border" type="text" v-model="user.name" v-bind:disabled="custInfoDisable" placeholder="Name"></p>
    <p>
    <input class="w3-input w3-border" type="text"  v-model="user.email" v-bind:disabled="custInfoDisable" placeholder="Email"></p>
    <p>
    <input class="w3-input w3-border" type="text" v-model="user.phone" v-bind:disabled="custInfoDisable" placeholder="Phone Number"></p>
    <hr>
    <table class="w3-table w3-striped w3-medium">
      <tr>
        <th>Qty</th>
        <th>Item</th>
        <th class="w3-right">Price (RM)</th>
      </tr>
      <tr v-for="odr in orderlist">
        <td>{{ odr.qty }}</td>
        <td>{{ odr.name }}</td>
        <td class="w3-right">
          {{ (odr.price * odr.qty).toFixed(2) }}
        </td>
      </tr>
    </table>
    <hr>
    <table class="w3-table w3-medium">
      <tr>
        <th>SUBTOTAL</th>
        <td class="w3-right">RM {{ subtotal.toFixed(2) }}</td>
      </tr>
      <tr>
        <th>SST (6%)</th>
        <td class="w3-right">RM {{ (subtotal * 0.06).toFixed(2) }}</td>
      </tr>
      <tr>
        <th>TOTAL</th>
        <td class="w3-right">RM {{ (subtotal + subtotal * 0.06).toFixed(2) }}</td>
      </tr>
    </table>
    <br>
  
    <table cellpadding="5">
      <tr>
        <td align="right"><b>Delivery Option:</b> </td>
        <td>
          <input type="radio" v-model="user.delivery" value="Dine-in" required> Dine-in
          <input type="radio" v-model="user.delivery" value="Takeaway" required> Takeaway
        </td>
      </tr>
    </table>
    <br>
    <textarea v-model="user.comments" rows="3" cols="30" placeholder="Additional Comments"></textarea><br><br>
    <div class="w3-container w3-center">
      <button v-on:click="confirm()">Confirm</button> 
      &nbsp;
      <button v-on:click="cancel()">Cancel</button>
    </div>
  `
};
