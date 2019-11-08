<template>
  <div class="time-table">
    <el-table
      :data="res"
      v-if="res.length"
      style="width: 100%;"
      row-key="enrollCode"
      :row-class-name="tableRowClassName"
      default-expand-all
    >
      <el-table-column prop="enrollCode" label="EnrollCode" width="100" align="center" />
      <el-table-column prop="instructor" label="Instructor" align="center" />
      <el-table-column prop="days" label="Days" width="70" align="center" />
      <el-table-column prop="time" label="Time" width="110" align="center" />
      <el-table-column prop="location" label="Location" align="center" />
      <el-table-column prop="space" label="Space" width="65" align="center" />
      <el-table-column prop="max" label="Max" width="50" align="center" />
    </el-table>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "TimeTable",
  props: ["res"],
  methods: {
    tableRowClassName({ row, rowIndex }) {
      if (row.disabled) return "disabled-row";
      if (row.status == "lecture") return "lecture-row";
      return "";
    }
  }
};
</script>

<style scoped>
div.time-table {
  margin: 20px 0;
}

div.row {
  display: flex;
}
</style>

<style>
.el-table .disabled-row {
  background: #eee;
}

.el-table .lecture-row {
  background: #f0f9eb;
}
</style>