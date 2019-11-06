<template>
  <div class="time-limit">
    <h1>Time Limit</h1>
    <p>Your time requirement for all weekdays.</p>
    <div class="row">
      <strong>Time Range:</strong>
      <el-time-picker is-range
        format="HH:mm"
        v-model="timerange"
        range-separator="To"
        start-placeholder="Earliest Time"
        end-placeholder="Latest Time"
        @change="change">
      </el-time-picker>
    </div>
    <div class="row">
      <strong>Break Time:</strong>
      <el-input-number v-model="breakTime" :min="0" @change="change"></el-input-number>
      <strong>Minutes</strong>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  name: "TimeLimit",
  data() {
    return {
      timerange: [],
      breakTime: '',
    }
  },
  mounted() {
    this.timerange = this.limit.timerange;
    this.breakTime = this.limit.break;
  },
  computed: {
    ...mapState(['limit']),
  },
  methods: {
    ...mapMutations(['setLimit']),
    change: function() {
      this.setLimit({
        timerange: this.timerange,
        break: this.breakTime,
      })
    }
  }
}
</script>

<style scoped>
div.time-limit {
  position: relative;
  width: 60%;
  max-width: 900px;
  min-width: 630px;

  margin: 20px;
  padding: 10px 20px;

  border-radius: 5px;
  text-align: left;

  box-shadow: 2px 2px 5px #999;
  background-color: #fff;
}

div.row {
  display: flex;
  width: 100%;
  margin: 20px 0;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
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