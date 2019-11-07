<template>
  <div class="planner">
    <CourseList />
    <div>
      <Events />
      <TimeLimit />
    </div>
  </div>
</template>

<script>
import CourseList from "@/components/CourseList.vue";
import Events from "@/components/Events.vue";
import TimeLimit from "@/components/TimeLimit.vue";

export default {
  name: "Planner",
  components: {
    CourseList,
    Events,
    TimeLimit
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