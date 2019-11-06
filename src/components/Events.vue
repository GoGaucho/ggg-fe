<template>
  <div class="events">
    <h1>Events</h1>
    <el-table :data="events"
      style="width: 100%;"
      empty-text="No Event">
      <el-table-column
        prop="name"
        label="Name"
        align="center" />
      <el-table-column
        prop="days"
        label="Days"
        align="center" />
      <el-table-column
        prop="timerange"
        label="Time Range"
        :formatter="getTimeRange"
        align="center" />
      <el-table-column
        prop="duration"
        label="Duration(min)"
        align="center" />
      <el-table-column fixed="right"
        label="Remove"
        width="100"
        align="center">
        <template slot-scope="scope">
          <el-button size="mini" type="danger" @click="removeEvents(scope.row)">Remove</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="row">
      <strong>Name:</strong>
      <el-input style="width: 300px;" placeholder="Event Name" v-model="name"></el-input>
      <el-button plain :disabled="!(name && days.length && duration)" type="primary" style="margin-left: 30px;" @click="add">Add to Events</el-button>
    </div>
    <div class="row">
      <strong>Days:</strong>
      <el-select style="width: 350px;" multiple filterable v-model="days" placeholder="Select Days" @change="sortDays">
        <el-option v-for="o in daysOptions" :value="o.key" :label="o.name" />
      </el-select>
    </div>
    <div class="row">
      <strong>Time Range:</strong>
      <el-time-picker is-range
        format="HH:mm"
        v-model="timerange"
        range-separator="To"
        start-placeholder="Start Time"
        end-placeholder="End Time">
      </el-time-picker>
    </div>
    <div class="row">
      <strong>Duration:</strong>
      <el-input-number v-model="duration" :min="0" />
      <strong>Minutes</strong>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations} from 'vuex'

export default {
  name: 'Event',
  data() {
    return {
      name: '',
      days: [],
      timerange: [new Date(0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 59)],
      duration: 30,
      daysOptions: [
        { name: 'Mon', key: 'M' },
        { name: 'Tue', key: 'T' },
        { name: 'Wed', key: 'W' },
        { name: 'Thu', key: 'R' },
        { name: 'Fri', key: 'F' },
      ]
    }
  },
  computed: {
    ...mapState(['events']),
  },
  methods: {
    ...mapMutations(['addEvents', 'removeEvents']),
    getTimeRange: function(r, c, timerange) {
      let res = "";
      res += timerange[0].Format("HH:mm");
      res += " - ";
      res += timerange[1].getHours() + ":" + timerange[1].getMinutes();
      return res;
    },
    add: function() {
      let event = {
        name: this.name,
        days: this.days,
        duration: this.duration,
        timerange: this.timerange,
      }
      this.addEvents(event);
      this.name = '';
      this.days = [];
      this.duration = 30;
      this.timerange = [new Date(0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 59)];
    },
    sortDays: function() {
      let sortedDays = [];
      for (let d of this.daysOptions) {
        if (this.days.includes(d.key)) sortedDays.push(d.key);
      }
      this.days = sortedDays;
    }
  },
}
</script>

<style scoped>
div.events {
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