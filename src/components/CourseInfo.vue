<template>
  <div class="course-info">
    <div class="loading" v-if="loading">{{id}}'s information is loading ...</div>
    <div v-if="course">
      <h2>
        {{course.courseId}} : {{course.title}} &nbsp;
        <span
          @click="addSelected(id)"
          class="add"
        >ADD to List</span>&nbsp;
        <span @click="$emit(`colapse`)" class="add">Close</span>
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
      <SubCourseInfo :quarter="quarter" :course="course" :id="id" :allowed="allowed" />
      <el-button
        v-if="!allowed&&!prevRess"
        :loading="loadHist"
        @click="loadPrevHist()"
      >Previous Quarters</el-button>
      <template v-if="prevRess">
        <div v-for="ress in prevRess" v-bind:key="ress.q">
          <h2>{{ress.qname}}</h2>
          <SubCourseInfo :quarter="ress.q" :course="ress.data" :id="id" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import SubCourseInfo from "@/components/SubCourseInfo.vue";

const qs = ["", "Winter", "Spring", "Summer", "Fall"];

export default {
  name: "CourseInfo",
  components: {
    SubCourseInfo
  },
  props: ["id", "allowed"],
  data() {
    return {
      loading: false,
      ress: [],
      codes: [],
      disables: [],
      rate: {},
      course: null,
      gradingOption: "",
      units: "",
      GEs: "",
      loadHist: false,
      prevRess: null
    };
  },
  computed: {
    ...mapState(["quarter"])
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
          console.log(error);
          swal("ERROR", "Network Error", "error");
        });
    },

    getRess(c, disables) {
      let ress = [];
      let res = [];
      let ses = "";
      c.classSections.sort((a, b) => {
        if (a.session && b.session)
          if (a.session < b.session) return -1;
          else if (a.session > b.session) return 1;
        if (a.section < b.section) return -1;
        if (a.section > b.section) return 1;
        return 0;
      });
      for (let i in c.classSections) {
        let s = c.classSections[i];
        if (s.session) {
          if (ses == "") ses = s.session.charAt(5);
          else if (ses != s.session.charAt(5)) {
            ress.push({ ses: ses, res: res });
            res = [];
            ses = s.session.charAt(5);
          }
        }
        let ss = {};
        ss.enrollCode = s.enrollCode;
        ss.disabled = s.courseCancelled || s.classClosed;
        if (disables && ss.disabled) disables.push(ss.enrollCode);
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
          ss.rate = "loading...";
          res.push(ss);
        } else {
          ss.status = "section";
          res[res.length - 1].children.push(ss);
        }
      }
      if (res.length > 0) ress.push({ ses: ses, res: res });
      return ress;
    },

    getCodes(ress) {
      return ress
        .map(res =>
          res.res.map(e => [e.enrollCode, e.children.map(x => x.enrollCode)])
        )
        .flat();
    },

    loadPrevHist: async function() {
      this.loadHist = true;
      try {
        const resp = await axios({
          method: "get",
          url: `/api/sche/getClassHistByID?id=${this.id}`
        });
        const prevRess = [];
        for (var c of resp.data) {
          if (c.q == this.quarter) continue;
          prevRess.push({
            q: c.q,
            qname: c.q.substring(0, 4) + qs[+c.q.substring(4)],
            data: c.data
          });
        }
        this.prevRess = prevRess;
      } catch (error) {
        console.log(error);
        swal("ERROR", "Network Error", "error");
      }
      this.loadHist = false;
    },

    getData() {
      const c = this.course;

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