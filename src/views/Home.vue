<template>
  <div class="home">
    <FindCourse v-if="findCourse" @toggle="findCourse = !findCourse" />
    <GETable v-else @toggle="findCourse = !findCourse" />
    <CourseList />
  </div>
</template>

<script>
import CourseList from "@/components/CourseList.vue";
import FindCourse from "@/components/FindCourse.vue";
import GETable from "@/components/GETable.vue";

export default {
  name: "Home",
  components: {
    CourseList,
    FindCourse,
    GETable
  },
  data() {
    return {
      findCourse: true
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