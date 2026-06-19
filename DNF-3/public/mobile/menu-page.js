// menu-page.js
export default {
  name: 'MenuPage',
  props: ['menulist', 'orderlist'],
  data() {
    return { };
  },
  
  methods: {
    addItem(item) {
      console.log(`add ${item.name}`);
      this.$emit('add-item', item);
    },
    
    reduceItem(item) {
      console.log(`reduce ${item.name}`);
      this.$emit('reduce-item', item);
    },
    
    orderQty(order) {
      if (order) {
        return order.qty;
      } else {
        return '';
      }
    }
  },
  
  template: `
    <h2>Menu</h2>
    <table class="w3-table w3-striped w3-medium">
      <tr>
        <th>Name</th>
        <th class="w3-right">Price (RM)</th>
        <th class="w3-center">Qty</th>
        <th></th>
      </tr>
      <tr v-for="item in menulist">
        <td>{{item.name}}</td>
        <td class="w3-right">{{item.price.toFixed(2)}}</td>
        <td class="w3-center">{{orderQty(orderlist[item.id])}}</td>
        <td class="w3-center">
          <button class="w3-button w3-small w3-light-blue" @click="addItem(item)">+</button>
          &nbsp;
          <button class="w3-button w3-small w3-light-grey" @click="reduceItem(item)">-</button>
        </td>
      </tr>
    </table>
  `
};
