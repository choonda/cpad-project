// menu-page.js
export default {
  name: 'MenuPage',
  props: ['menulist', 'orderlist', 'stalls', 'selectedStallId'],
  
  computed: {
    foodItems() {
      return this.menulist.filter(item => item.category === 'food');
    },
    beverageItems() {
      return this.menulist.filter(item => item.category === 'beverage');
    }
  },

  methods: {
    addItem(item) {
      if (!item.is_available) return;
      console.log(`add ${item.item_name}`);
      this.$emit('add-item', item);
    },
    
    reduceItem(item) {
      console.log(`reduce ${item.item_name}`);
      this.$emit('reduce-item', item);
    },
    
    orderQty(order) {
      if (order && order.qty > 0) {
        return order.qty;
      }
      return 0;
    },

    onStallChange(value) {
      const stallId = value === "" || value === "null" ? null : parseInt(value);
      this.$emit('filter-stall', stallId);
    }
  },
  
  template: `
    <div class="menu-page-container">
      <h3 class="font-weight-bold text-dark mb-3">Browse Menu</h3>
      
      <!-- Stall Filter Section -->
      <div class="card p-3 shadow-sm mb-4 border-0 bg-white rounded-3">
        <h5 class="text-muted font-weight-bold mb-2 small" style="letter-spacing: 0.5px;">FILTER BY FOOD STALL</h5>
        <select class="form-select font-weight-bold text-dark border-0 bg-light" :value="selectedStallId" @change="onStallChange($event.target.value)">
          <option :value="null">All Food & Drinks</option>
          <option v-for="stall in stalls" :key="stall.stall_id" :value="stall.stall_id">
            {{ stall.stall_name }}
          </option>
        </select>
      </div>

      <!-- Food Category Header -->
      <h4 class="category-header font-weight-bold mb-3 small text-uppercase" style="border-left: 4px solid #800020; padding-left: 10px; color: #495057; letter-spacing: 0.5px;">Food</h4>
      
      <div v-if="foodItems.length === 0" class="text-center py-4 text-muted small bg-white rounded shadow-sm border mb-4">
        No food choices matching this category are online today.
      </div>
      
      <!-- Food Cards -->
      <div v-else class="d-flex flex-column gap-2 mb-4">
        <div v-for="item in foodItems" :key="item.menu_id" class="card border-0 shadow-sm p-3 bg-white rounded-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="font-weight-bold text-dark mb-1" style="font-size: 1.05rem;">{{ item.item_name }}</h5>
              <p class="text-success font-weight-bold mb-0">RM {{ parseFloat(item.price).toFixed(2) }}</p>
            </div>
            <span class="badge bg-light text-secondary font-weight-bold border small">Food</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <div>
              <span v-if="!item.is_available" class="badge font-weight-bold" style="font-size: 0.75rem; background-color: #fce8e6; color: #a8071a; border: 1px solid #ffccc7;">Sold Out</span>
              <span v-else class="text-muted small font-weight-bold text-secondary">In Stock</span>
            </div>
            <div v-if="item.is_available" class="d-flex align-items-center gap-2">
              <button v-if="orderQty(orderlist[item.menu_id]) > 0" class="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; padding: 0; font-weight: bold;" @click="reduceItem(item)">-</button>
              <span v-if="orderQty(orderlist[item.menu_id]) > 0" class="badge rounded-pill bg-dark font-weight-bold px-2 py-1" style="font-size: 0.85em;">
                {{ orderQty(orderlist[item.menu_id]) }}
              </span>
              <button class="btn btn-sm rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; padding: 0; font-weight: bold; background-color: #800020;" @click="addItem(item)">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Beverages Category Header -->
      <h4 class="category-header font-weight-bold mb-3 small text-uppercase" style="border-left: 4px solid #800020; padding-left: 10px; color: #495057; letter-spacing: 0.5px;">Beverages</h4>
      
      <div v-if="beverageItems.length === 0" class="text-center py-4 text-muted small bg-white rounded shadow-sm border mb-4">
        No beverage choices matching this category are online today.
      </div>
      
      <!-- Beverage Cards -->
      <div v-else class="d-flex flex-column gap-2 mb-4">
        <div v-for="item in beverageItems" :key="item.menu_id" class="card border-0 shadow-sm p-3 bg-white rounded-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="font-weight-bold text-dark mb-1" style="font-size: 1.05rem;">{{ item.item_name }}</h5>
              <p class="text-success font-weight-bold mb-0">RM {{ parseFloat(item.price).toFixed(2) }}</p>
            </div>
            <span class="badge bg-light text-secondary font-weight-bold border small">Drink</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <div>
              <span v-if="!item.is_available" class="badge font-weight-bold" style="font-size: 0.75rem; background-color: #fce8e6; color: #a8071a; border: 1px solid #ffccc7;">Sold Out</span>
              <span v-else class="text-muted small font-weight-bold text-secondary">In Stock</span>
            </div>
            <div v-if="item.is_available" class="d-flex align-items-center gap-2">
              <button v-if="orderQty(orderlist[item.menu_id]) > 0" class="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; padding: 0; font-weight: bold;" @click="reduceItem(item)">-</button>
              <span v-if="orderQty(orderlist[item.menu_id]) > 0" class="badge rounded-pill bg-dark font-weight-bold px-2 py-1" style="font-size: 0.85em;">
                {{ orderQty(orderlist[item.menu_id]) }}
              </span>
              <button class="btn btn-sm rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; padding: 0; font-weight: bold; background-color: #800020;" @click="addItem(item)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
