<template>
  <div class="time-table">
    <el-table
      v-bind:data="res"
      v-if="res.length"
      style="width: 100%;"
      row-key="enrollCode"
      :row-class-name="tableRowClassName"
      @row-click="$emit(`click-row`,$event)"
      @expand-change="clickexp"
    >
      <el-table-column prop="enrollCode" label="EnrollCode" width="100" align="center" />
      <el-table-column prop="instructor" label="Instructor" align="center" />
      <el-table-column prop="rate" label="Score/difficulty" align="center">
        <template slot-scope="scope">
          <el-popover trigger="hover" :disabled="!scope.row.rateToolTip" placement="right">
            <div v-if="scope.row.rateToolTip">
              <p>{{scope.row.rateToolTip.msg}}</p>
              <a
                v-if="scope.row.rateToolTip.link"
                target="_blank"
                :href="`https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${scope.row.rateToolTip.link}`"
              >Open Rate My Professor</a>
              <el-table :data="scope.row.rateToolTip.data" v-if="scope.row.rateToolTip.data">
                <el-table-column prop="name" label="Name" align="center" width="100" />
                <el-table-column prop="dept" label="Department" align="center" width="150" />
                <el-table-column prop="rate" label="Score" align="center" />
                <el-table-column prop="diff" label="Difficulty" align="center" />
                <el-table-column prop="diff" label="Links" align="center">
                  <template slot-scope="linker">
                    <a
                      v-if="linker.row.rmpid"
                      target="_blank"
                      :href="`https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${linker.row.rmpid}`"
                    >Link</a>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div slot="reference">{{scope.row.rate}}</div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="days" label="Days" width="70" align="center">
        <template slot-scope="scope">
          <div :style="scope.row.conflict?'color:red':'color:black'">{{scope.row.days}}</div>
        </template>
      </el-table-column>
      <el-table-column prop="time" label="Time" width="110" align="center">
        <template slot-scope="scope">
          <div :style="scope.row.conflict?'color:red':'color:black'">{{scope.row.time}}</div>
        </template>
      </el-table-column>
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
    },

    clickexp(row, expanded) {
      this.$emit("click-exp", row, expanded);
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