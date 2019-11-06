import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    quarter: '',
    selected: [],
    course: null,
    events: [],
    limit: {
      timerange: [new Date(0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 59)],
      break: 10,
    },
    results: [],
  },
  mutations: {
    setQuarter (state, quarter) {
      state.quarter = quarter;
    },
    addSelected (state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) return;
      }
      state.selected.push(course);
    },
    removeSelected (state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) {
          state.selected.splice(i, 1);
        }
      }
    },
    setCourse (state, course) {
      state.course = course;
    },
    addEvents (state, event) {
      for (let i in state.events) {
        if (state.events[i].name === event.name) return;
      }
      state.events.push(event);
    },
    removeEvents (state, event) {
      for (let i in state.events) {
        if (state.events[i].name === event.name) {
          state.events.splice(i, 1);
        }
      }
    },
    setLimit (state, limit) {
      state.limit = limit;
    },
    addResults (state, result) {
      let copy = [];
      for (let i of result) copy.push(i);
      state.results.push(copy);
    },
    clearResults (state) {
      state.results = [];
    }
  },
  actions: {

  }
})
