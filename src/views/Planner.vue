<template>
  <div class="planner">
    <SelectedList />
    <div>
      <CourseTree />
      <TimeLimit />
      <Events />
    </div>
  </div>
</template>

<script>
import SelectedList from "@/components/SelectedList.vue";
import Events from "@/components/Events.vue";
import TimeLimit from "@/components/TimeLimit.vue";
import CourseTree from "@/components/CourseTree.vue"

export default {
  name: "Planner",
  components: {
    SelectedList,
    Events,
    TimeLimit,
    CourseTree
  }
};
</script>

<style scoped>
div.planner {
  width: calc(100% - 20px);
  min-height: calc(100vh - 80px);
  padding: 20px 10px 0;

  display: flex;
  justify-content: center;
  align-items: flex-start;

  background-color: #eee;
}
</style>