export default {
  formatPhone: function(val) {
    if (!val || val === '') { return ''; }
    if (!/^\d{10}$/.test(val)) { return val; }
    return '(' + val.slice(0, 3) + ') ' +
      val.slice(3, 6) + '-' +
      val.slice(6, 10);
  }
};
