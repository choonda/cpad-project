// check-order-page.js
export default {
  name: 'CheckOrderPage',
  props: ['user'],
  
  data() {
    return {
      ordersHistory: [],
      errorMessage: null,
      pollingIntervalId: null
    };
  },

  mounted() {
    if (this.user && this.user.id) {
      this.fetchCustomerOrders();
      
      // Setup live polling interval loop (every 5 seconds)
      this.pollingIntervalId = setInterval(() => {
        this.fetchCustomerOrders();
      }, 5000);
    } else {
      this.errorMessage = "Please sign in to view your order history and tracking status.";
    }
  },

  unmounted() {
    // Clear polling loop to prevent memory leaks
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
  },

  methods: {
    async fetchCustomerOrders() {
      if (!this.user || !this.user.id) return;
      
      try {
        const url = `/cpad-project/DNF-3/api/orders?customer_id=${this.user.id}`;
        const response = await fetch(url);
        const outcome = await response.json();

        if (response.ok && outcome.success) {
          this.ordersHistory = outcome.data.map(order => {
            const existing = this.ordersHistory.find(o => o.order_id === order.order_id);
            return {
              ...order,
              isExpanded: existing ? existing.isExpanded : false,
              itemsList: existing ? existing.itemsList : [],
              isLoadingItems: existing ? existing.isLoadingItems : false
            };
          });
          this.errorMessage = null;
        } else {
          this.errorMessage = outcome.error || 'Failed to update live transaction pipelines tracking.';
        }
      } catch (err) {
        console.error("Order tracking refresh error:", err);
      }
    },

    async toggleOrderDetails(order) {
      if (!order.isExpanded) {
        if (order.itemsList.length === 0) {
          order.isLoadingItems = true;
          try {
            const response = await fetch(`/cpad-project/DNF-3/api/orders/${order.order_id}/items`);
            const outcome = await response.json();
            if (response.ok && outcome.success) {
              order.itemsList = outcome.data;
            }
          } catch (err) {
            console.error("Failed to load order items list:", err);
          } finally {
            order.isLoadingItems = false;
          }
        }
        order.isExpanded = true;
      } else {
        order.isExpanded = false;
      }
    },

    getStatusBadgeClass(status) {
      if (status === 'Received') return 'status-received';
      if (status === 'Preparing') return 'status-preparing';
      if (status === 'Ready') return 'status-ready';
      if (status === 'Collected') return 'status-collected';
      return 'bg-secondary text-white';
    },

    getStatusAlertClass(status) {
      if (status === 'Received') return 'alert-info text-primary';
      if (status === 'Preparing') return 'alert-warning text-warning-emphasis';
      if (status === 'Ready') return 'alert-success text-success-emphasis';
      if (status === 'Collected') return 'alert-secondary text-secondary-emphasis';
      return 'alert-light';
    },

    getStatusMessage(order) {
      if (order.status === 'Received') return 'Waiting for kitchen acceptance';
      if (order.status === 'Preparing') return 'Chef is preparing your dishes';
      if (order.status === 'Ready') {
        return order.order_type === 'Takeaway' ? 'Ready for Takeaway! Claim at stall.' : 'Ready for Pickup! Claim at stall.';
      }
      if (order.status === 'Collected') {
        return order.order_type === 'Takeaway' ? 'Taken away successfully!' : 'Collected! Thank you for dining.';
      }
      return 'Status unknown';
    }
  },
  
  template: `
    <div class="check-orders-container">
      <h3 class="font-weight-bold text-dark mb-3">My Orders</h3>
      
      <!-- Notifications -->
      <div v-if="errorMessage" class="alert alert-warning font-weight-bold small py-2 mb-3" role="alert">
        {{ errorMessage }}
      </div>

      <!-- No Orders Case -->
      <div v-if="user.id && ordersHistory.length === 0" class="card border-0 shadow-sm p-4 text-center text-muted bg-white rounded-3">
        <p class="mb-0 font-weight-bold small">No orders found. Once you place an order, it will appear here for live tracking.</p>
      </div>

      <!-- Orders List -->
      <div v-if="user.id && ordersHistory.length > 0">
        <div v-for="order in ordersHistory" :key="order.order_id" 
             class="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3 order-card" 
             @click="toggleOrderDetails(order)"
             style="cursor: pointer; border-left: 5px solid;" 
             :style="{ borderLeftColor: order.status === 'Ready' ? '#1b5e20' : (order.status === 'Preparing' ? '#e65100' : (order.status === 'Received' ? '#0d47a1' : '#37474f')) }">
          
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="text-muted font-weight-bold small">Order #{{ order.customer_order_id || order.order_id }}</span>
              <span class="badge bg-secondary font-weight-bold text-white small ms-2" style="font-size: 0.75rem;">
                {{ order.order_type === 'Takeaway' ? 'Takeaway' : 'Dine In' }}
              </span>
              <div class="text-muted small mt-1" style="font-size: 0.85em;">{{ order.order_date }}</div>
            </div>
            <div class="text-end">
              <div class="text-success font-weight-bold" style="font-size: 1.15rem;">
                RM {{ parseFloat(order.total_price).toFixed(2) }}
              </div>
              <span class="badge status-badge font-weight-bold mt-1" :class="getStatusBadgeClass(order.status)">
                {{ order.status }}
              </span>
            </div>
          </div>

          <div class="alert font-weight-bold small py-2 px-3 mt-3 mb-1" :class="getStatusAlertClass(order.status)" style="font-size: 0.85em;">
            {{ getStatusMessage(order) }}
          </div>

          <!-- Expandable Order Items Area -->
          <div v-if="order.isExpanded" class="mt-3 pt-3 border-top" @click.stop>
            <h6 class="font-weight-bold text-secondary mb-2 small">Order Items Details:</h6>
            
            <div v-if="order.isLoadingItems" class="text-center py-2">
              <span class="spinner-border spinner-border-sm text-secondary me-2" role="status"></span>
              <span class="text-muted small">Loading items...</span>
            </div>
            
            <div v-else-if="order.itemsList && order.itemsList.length > 0">
              <table class="table table-sm table-striped align-middle mb-0 small">
                <thead>
                  <tr class="table-light text-muted">
                    <th>Item</th>
                    <th class="text-center">Qty</th>
                    <th class="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in order.itemsList">
                    <td>
                      <div class="font-weight-bold">{{ item.item_name }}</div>
                      <span class="badge bg-light text-secondary border small" style="font-size: 0.75em;">
                        {{ item.stall_name || 'Stall' }}
                      </span>
                    </td>
                    <td class="text-center font-weight-bold">{{ item.quantity }}</td>
                    <td class="text-end text-success font-weight-bold">RM {{ parseFloat(item.subtotal).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-muted small text-center py-2">No items found for this order.</div>
          </div>

        </div>
      </div>
    </div>
  `
};
