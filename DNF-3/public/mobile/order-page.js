// order-page.js
export default {
  name: 'OrderPage',
  props: ['orderlist', 'subtotal', 'user'],
  
  data() {
    return {
      isSubmitting: false,
      errorMessage: null,
      successMessage: null
    };
  },

  computed: {
    hasItems() {
      return Object.keys(this.orderlist).length > 0;
    },
    totalAmount() {
      return this.subtotal;
    }
  },
  
  methods: {
    async confirm() {
      if (!this.user.id) {
        this.errorMessage = "You must be signed in to place an order. Please log in first.";
        return;
      }
      if (!this.hasItems) {
        this.errorMessage = "Your cart is empty. Please add items to your order first.";
        return;
      }

      this.errorMessage = null;
      this.successMessage = null;
      this.isSubmitting = true;

      // Map the local cart object structure to the backend payload structure
      const itemsPayload = Object.keys(this.orderlist).map(menuId => {
        const item = this.orderlist[menuId];
        return {
          menu_id: parseInt(menuId),
          quantity: item.qty,
          price: parseFloat(item.price)
        };
      });

      const orderPayload = {
        customer_id: parseInt(this.user.id),
        total_price: parseFloat(this.totalAmount.toFixed(2)),
        items: itemsPayload,
        order_type: this.user.delivery === 'Takeaway' ? 'Takeaway' : 'Dine In'
      };

      try {
        const response = await fetch('/cpad-project/DNF-3/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderPayload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const orderMsg = data.order_ids ? data.order_ids.map(id => '#' + id).join(', ') : '#' + data.order_id;
          this.successMessage = `Success! Order placed: ${orderMsg}. Routing to tracking...`;
          
          setTimeout(() => {
            this.successMessage = null;
            this.$emit('order-success');
          }, 1800);
        } else {
          this.errorMessage = data.error || 'Failed to submit order. Please try again.';
        }
      } catch (err) {
        console.error("Order submit exception:", err);
        this.errorMessage = 'Network connection issue during order checkout. Please try again.';
      } finally {
        this.isSubmitting = false;
      }
    },
    
    cancel() {
      this.$emit('reset-order');
    }
  },
  
  template: `
    <div class="order-page-container">
      <h3 class="font-weight-bold text-dark mb-3">Checkout</h3>
      
      <!-- Notifications -->
      <div v-if="errorMessage" class="alert alert-danger font-weight-bold small py-2 mb-3" role="alert">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success font-weight-bold small py-2 mb-3" role="alert">
        {{ successMessage }}
      </div>

      <!-- Customer Summary -->
      <div class="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3">
        <h5 class="text-secondary font-weight-bold small text-uppercase mb-2" style="letter-spacing: 0.5px;">Customer Profile</h5>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-muted small">Name / Display:</span>
          <span class="font-weight-bold text-dark small">{{ user.name || 'Valued Guest' }}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted small">Account Role:</span>
          <span class="badge bg-light text-secondary font-weight-bold border small">{{ user.role || 'Guest' }}</span>
        </div>
        <p v-if="!user.id" class="text-danger small font-weight-bold mt-2 mb-0">Please sign in to place order.</p>
      </div>

      <!-- Order Items -->
      <div class="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3">
        <h5 class="text-secondary font-weight-bold small text-uppercase mb-2" style="letter-spacing: 0.5px;">Your Cart Items</h5>
        <div v-if="!hasItems" class="text-center py-4 text-muted small">
          Your shopping cart is currently empty.
        </div>
        <div v-else>
          <table class="table table-sm table-striped align-middle mb-0 small">
            <thead>
              <tr class="table-light text-muted">
                <th>Qty</th>
                <th>Item Description</th>
                <th class="text-end">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in orderlist">
                <td class="font-weight-bold">{{ item.qty }}</td>
                <td>{{ item.name }}</td>
                <td class="text-end font-weight-bold">RM {{ (item.price * item.qty).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <hr class="my-3">
          
          <table class="table table-sm table-borderless mb-0 mt-2 small font-weight-bold text-dark">
            <tr style="font-size: 1.15em;">
              <td style="color: #800020; font-weight: 800;">TOTAL BILL</td>
              <td class="text-end text-success" style="font-weight: 800;">RM {{ totalAmount.toFixed(2) }}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Takeaway Option -->
      <div v-if="hasItems" class="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3">
        <div class="mb-3">
          <label class="form-label font-weight-bold text-secondary small d-block mb-2">FULFILLMENT OPTION</label>
          <div class="btn-group w-100" role="group" aria-label="Order type selection">
            <input type="radio" class="btn-check" name="orderType" id="dineInRadio" value="Dine In" v-model="user.delivery" autocomplete="off" :disabled="isSubmitting">
            <label class="btn btn-outline-dark font-weight-bold py-2" for="dineInRadio">Dine In</label>

            <input type="radio" class="btn-check" name="orderType" id="takeawayRadio" value="Takeaway" v-model="user.delivery" autocomplete="off" :disabled="isSubmitting">
            <label class="btn btn-outline-dark font-weight-bold py-2" for="takeawayRadio">Takeaway</label>
          </div>
        </div>
        <div class="form-group mb-2">
          <textarea class="form-control" v-model="user.comments" rows="2" placeholder="Additional instructions/comments..." :disabled="isSubmitting"></textarea>
        </div>
      </div>

      <!-- Buttons -->
      <div class="row g-2 mt-3">
        <div class="col-6">
          <button class="btn btn-lg w-100 font-weight-bold text-white shadow-sm" style="background-color: #800020;" @click="confirm()" :disabled="isSubmitting || !user.id || !hasItems">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            Confirm
          </button>
        </div>
        <div class="col-6">
          <button class="btn btn-lg btn-outline-secondary w-100 font-weight-bold shadow-sm" @click="cancel()" :disabled="isSubmitting">
            Clear
          </button>
        </div>
      </div>
    </div>
  `
};
