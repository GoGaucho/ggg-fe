<template>
  <div class="course-info">
    <div class="loading" v-if="loading">{{id}}'s information is loading ...</div>
    <div v-if="course">
      <h2>
        {{course.courseId}} : {{course.title}} &nbsp;
        <span
          @click="addSelected(course.courseId)"
          class="add"
        >ADD to List</span>
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
      <TimeTable v-if="res" v-bind:res="res" />
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
  props: ["id"],
  data() {
    return {
      loading: false,
      res: [],
      course: null,
      gradingOption: "",
      units: "",
      GEs: ""
    };
  },
  computed: {
    ...mapState(['quarter'])
  },
  mounted() {
    this.loadCourse();
  },
  methods: {
    ...mapMutations(["addSelected"]),

    loadCourse() {
      this.loading = true;
      axios // get course info
        .get("/api/sche/getClassByID", {
          params: {
            q: this.quarter,
            id: this.id
          }
        })
        .then(resp => {
          this.course = resp.data;
          this.getData();
          this.loading = false;
        })
        .catch(error => {
          this.loading = false;
          swal("ERROR", "Network Error", "error");
        });
    },

    getData() {
      const c = this.course;
      let res = [];
      for (let i in c.classSections) {
        let s = c.classSections[i];
        let ss = {};
        ss.enrollCode = s.enrollCode;
        ss.disabled = s.courseCancelled || s.classClosed;
        ss.max = s.maxEnroll;
        ss.space = s.maxEnroll - s.enrolledTotal;

        for (let i in s.instructors) {
          if (i == 0) ss.instructor = "";
          else ss.instructor += "\n";
          ss.instructor += s.instructors[i].instructor;
        }

        if (!s.timeLocations[0]) {
          // process time/location
          ss.days = "T.B.A.";
          ss.time = "T.B.A.";
          ss.location = "T.B.A.";
        } else {
          for (let j in s.timeLocations) {
            let tl = s.timeLocations[j];
            if (j == 0) {
              ss.days = "";
              ss.time = "";
              ss.location = "";
            } else {
              ss.days += "\n";
              ss.time += "\n";
              ss.location += "\n";
            }
            ss.days += tl.days;
            ss.time += tl.beginTime + " - " + tl.endTime;
            ss.location += tl.building + " " + tl.room;
          }
          ss.days = ss.days.replace(/null/g, "T.B.A.");
          ss.time = ss.time.replace(/null/g, "T.B.A.");
          ss.location = ss.location.replace(/null/g, "T.B.A.");
        }

        if (s.section % 100 == 0) {
          // process lecture/section
          ss.children = [];
          ss.status = "lecture";
          res.push(ss);
        } else {
          ss.status = "section";
          res[res.length - 1].children.push(ss);
        }
      }
      this.res = res;

      this.gradingOption = (a =>
        !a ? "Optional" : a == "L" ? "Letter" : "Pass / No Pass")(
        c.gradingOption
      );
      this.units = ((a, b, c) => (a ? a : `${b} - ${c}`))(
        c.unitsFixed,
        c.unitsVariableLow,
        c.unitsVariableHigh
      );
      this.GEs = (ge =>
        !ge.length
          ? "No"
          : ge
              .map(e => `${e.geCode}(${e.geCollege})`.replace(/\s/g, ""))
              .join(",    "))(c.generalEducation);
    }
  }
};
</script>

<style scoped>
div.loading {
  color: #036;
  font-size: 1.2rem;
}

div.course-info {
  width: 100%;
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