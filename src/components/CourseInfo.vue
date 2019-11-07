<template>
  <div class="course-info">
    <div v-if="course">
      <h2>
        {{course.courseId}} : {{course.title}} &nbsp;
        <span @click="addSelected(course.courseId)" class="add">ADD to List</span>
      </h2>
      <p>{{course.description}}</p>
      <div class="note">
        <strong>Grading :</strong>
        {{gradingOption}}
      </div>
      <div class="note">
        <strong>Unit :</strong>
        {{units}}
      </div>
      <div class="note">
        <strong>GE :</strong>
        {{GEs}}
      </div>
      <TimeTable />
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import TimeTable from "@/components/TimeTable.vue";

export default {
  name: "CourseInfo",
  components: {
    TimeTable
  },
  computed: {
    ...mapState(["course"]),
    gradingOption: function() {
      if (!this.course.gradingOption) return "Optional";
      if (this.course.gradingOption == "L") return "Letter";
      if (this.course.gradingOption == "P") return "Pass / No Pass";
    },
    units: function() {
      if (this.course.unitsFixed) return this.course.unitsFixed;
      else
        return (
          this.course.unitsVariableLow + " - " + this.course.unitsVariableHigh
        );
    },
    GEs: function() {
      if (!this.course.generalEducation.length) return "No";
      let res = "";
      for (let i in this.course.generalEducation) {
        let ge = this.course.generalEducation[i];
        if (i != 0) res += ",    ";
        res += (ge.geCode + "(" + ge.geCollege + ")").replace(/\s/g, "");
      }
      return res;
    }
  },
  methods: {
    ...mapMutations(["addSelected"])
  }
};
</script>

<style scoped>
div.course-info {
  width: 90%;
  margin: 20px 10px;
}

span.add {
  font-size: 1rem;
  color: #369;
  text-decoration: underline;
}

h2 {
  margin: 10px 0;
}

p {
  width: calc(100% - 20px);
  margin: 0 10px 20px 10px;
}

div.note {
  font-size: 1.1rem;
  margin: 3px;
}
</style>