<template>
  <div class="course-list">
    <el-table :data="data.list" v-if="data.list.length" style="width: 100%;">
      <el-table-column fixed type="expand">
        <template slot-scope="scope" style="padding: 20px 10px;">
          <CourseInfo v-bind:detail="scope.row.detail" />
        </template>
      </el-table-column>
      <el-table-column fixed prop="name" label="Course" align="center" />
      <el-table-column fixed label="ADD" width="80" align="center">
        <template slot-scope="scope" v-if="scope.row.name">
          <el-button size="mini" @click="addSelected(scope.row.name)">ADD</el-button>
        </template>
      </el-table-column>
      <el-table-column v-for="ge in data.ge" :prop="ge" :label="ge" align="center" v-bind:key="ge" />
    </el-table>
  </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import Selector from "@/components/Selector.vue";
import CourseInfo from "@/components/CourseInfo.vue";

export default {
  name: "CourseList",
  components: {
    CourseInfo
  },
  computed: {
    ...mapState(["courseList", "quarter"]),
    data: function() {
      const ans = {
        list: this.courseList.list,
        ge: this.courseList.ge
      };
      this.courseList.list.forEach(
        e => (e.detail = { quarter: this.quarter, name: e.name })
      );
      return ans;
    }
  },
  methods: {
    ...mapMutations(["addSelected", "setCourse"])
  }
};
</script>

<style scoped>
div.course-list {
  width: calc(100% - 20px);
  margin: 20px 0;
  padding: 10px 20px;
  text-align: left;
  background-color: #fff;
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