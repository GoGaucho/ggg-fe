<template>
  <div class="home">
    <FindCourse />
    <SelectedList />
  </div>
</template>

<script>
import SelectedList from "@/components/SelectedList.vue";
import FindCourse from "@/components/FindCourse.vue";

export default {
  name: "Home",
  components: {
    SelectedList,
    FindCourse
  },
  data() {
    return {
    };
  }
};
</script>

<style scoped>
div.home {
  width: calc(100% - 20px);
  min-height: calc(100vh - 80px);
  padding: 20px 10px 0;

  display: flex;
  justify-content: center;
  align-items: flex-start;

  background-color: #eee;
}
</style>