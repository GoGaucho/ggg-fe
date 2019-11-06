<template>
  <div class="bar">
    <strong>GoGaucho GOLD</strong>
  </div>
</template>

<script>
export default {
  name: 'Bar'
}
</script>

<style scoped>
div.bar {
  position: fixed;
  z-index: 999999999;
  top: 0;
  height: 60px;
  width: calc(100% - 20px);
  padding-left: 20px;
  line-height: 60px;
  color: #ffce34;
  background-color: #036;

  font-size: 1.8rem;
  text-align: left;
}
</style>