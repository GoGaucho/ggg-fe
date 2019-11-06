<template>
  <div class="GE-table">
    <div class="toggle" @click="$emit('toggle')">Find Course</div>
    <h1>GE Table</h1>
    <Selector :GETable="true" @select="select" />
    <div>&nbsp;</div>
    <el-table :data="courseGE"
      v-if="courseGE.length"
      style="width: 100%;">
      <el-table-column fixed
        prop="course"
        label="Course"
        align="center" />
      <el-table-column fixed
        label="ADD"
        width="80"
        align="center">
        <template slot-scope="scope">
          <el-button size="mini" @click="addSelected(scope.row.course)">ADD</el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-for="ge in GEs"
        :prop="ge"
        :label="ge"
        align="center" />
    </el-table>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import Selector from "@/components/Selector.vue"

var GECode = [];

export default {
  name: "GETable",
  components: {
    Selector
  },
  data() {
    return {
      courseGE: [],
      GEs: [],
    }
  },
  methods: {
    ...mapMutations(['addSelected']),
    select: function(quarter, college, GE) {
      this.courseGE = [];
      this.GEs = GE;
      axios // get GE list
        .get("/api/sche/getGEList?q=" + quarter)
        .then((resp) => {
          for (let ge of resp.data) {
            if (ge.col == college) {
              GECode = ge.codes;
              this.process();
              break;
            }
          }
        })
        .catch((error) => {
          swal("ERROR", "", "error");
        })
    },
    process: async function() {
      for (let i in GECode) { // add all courses
        if (this.GEs.includes(GECode[i].code)) {
          for (let course of GECode[i].list) {
            this.addCourse(course);
            this.addGE(course, GECode[i].code);
          }
        }
      }
    },
    addCourse: function(newCourse) {
      for (let i in this.courseGE) {
        if (this.courseGE[i].course == newCourse) return;
      }
      this.courseGE.push({ course: newCourse });
    },
    addGE: function(course, GE) {
      for (let i in this.courseGE) {
        if (this.courseGE[i].course == course) {
          this.courseGE[i][GE] = "X";
          return;
        }
      }
    },
  }
}
</script>

<style scoped>
div.GE-table {
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

div.row {
  display: flex;
  width: 100%;
  margin: 20px 0;
  justify-content: flex-start;
  align-items: center;
}

h1, h3, h5 {
  color: #036;
}

strong {
  margin: 0 10px;
  color: #036;
}

hr {
  width: 80;
  border: 1px solid;
  border-color: #036;
  border-radius: 1px;
}
</style>