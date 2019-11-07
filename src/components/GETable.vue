<template>
  <el-table
    :data="courseList.list"
    v-if="courseList.list.length"
    style="width: 100%;"
    @click="loadCourse(scope.row.name)"
  >
    <el-table-column fixed prop="name" label="Course" align="center" />
    <el-table-column fixed label="ADD" width="80" align="center">
      <template slot-scope="scope">
        <el-button size="mini" @click="addSelected(scope.row.name)">ADD</el-button>
      </template>
    </el-table-column>
    <el-table-column
      v-for="ge in courseList.ge"
      :prop="ge"
      :label="ge"
      align="center"
      v-bind:key="ge"
    />
  </el-table>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import Selector from "@/components/Selector.vue";
import CourseInfo from "@/components/CourseInfo.vue";

export default {
  name: "GETable",
  data() {
    return {};
  },
  computed: {
    ...mapState(["courseList"])
  },
  methods: {
    ...mapMutations(["addSelected", "setCourse"]),

    loadCourse(c) {
      this.loading = true;
      axios // get course info
        .get("/api/sche/getClassByID", {
          params: {
            q: this.quarter,
            id: c
          }
        })
        .then(resp => {
          this.loading = false;
          this.setCourse(resp.data);
          this.$emit("select");
        })
        .catch(error => {
          this.loading = false;
          swal("ERROR", "Network Error", "error");
        });
    }
  }
};
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

h1,
h3,
h5 {
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