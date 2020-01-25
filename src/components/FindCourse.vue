<template>
  <div class="find-course">
    <h1>Find Courses</h1>
    <Selector :fixed="fixed" />
    <CourseList />
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import Selector from "@/components/Selector.vue";
import CourseList from "@/components/CourseList.vue";

export default {
  name: "FindCourse",
  props: ["fixed"],
  components: {
    Selector,
    CourseList
  }
};
</script>

<style scoped>
div.find-course {
  position: relative;
  width: 60%;
  max-width: 900px;
  min-width: 630px;
  min-height: calc(100vh - 150px);

  margin: 20px;
  padding: 10px 20px;

  border-radius: 5px;
  text-align: left;

  box-shadow: 2px 2px 5px #999;
  background-color: #fff;
}

div.toggle {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 1.2rem;
  color: #036;
  text-decoration: underline;
}

h1,
h3,
h5 {
  color: #036;
}

hr {
  width: 80;
  border: 1px solid;
  border-color: #036;
  border-radius: 1px;
}
</style>