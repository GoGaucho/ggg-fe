import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const init = (key, def) => ((a) => a ? def !== "" ? JSON.parse(a) : a : def)(localStorage.getItem(key));

export default new Vuex.Store({
  state: {
    quarter: init("quarter", ""),
    selected: init("selected", []),
    events: init("events", []),
    limit: init("limit", {
      timerange: [new Date(0, 0, 0, 8, 0), new Date(0, 0, 0, 22, 0)],
      break: 10,
    }),

    courseList: { list: [], ge: [] },
    course: null,
    results: [],
  },
  mutations: {
    setQuarter(state, quarter) {
      if (state.quarter != quarter) {
        state.selected = [];
        localStorage.selected = JSON.stringify(state.selected);
      }
      state.quarter = quarter;

      localStorage.quarter = quarter;
    },

    addSelected(state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) return;
      }
      state.selected.push(course);

      localStorage.selected = JSON.stringify(state.selected);
    },

    removeSelected(state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) {
          state.selected.splice(i, 1);
        }
      }

      localStorage.selected = JSON.stringify(state.selected);
    },

    setCourseList(state, list) {
      state.courseList = { list: list.list, ge: list.ge };
    },

    setCourse(state, course) {
      state.course = course;
    },

    addEvents(state, event) {
      for (let i in state.events) {
        if (state.events[i].name === event.name) return;
      }
      state.events.push(event);

      localStorage.events = JSON.stringify(state.events);
    },

    removeEvents(state, event) {
      for (let i in state.events) {
        if (state.events[i].name === event.name) {
          state.events.splice(i, 1);
        }
      }

      localStorage.events = JSON.stringify(state.events);
    },

    setLimit(state, limit) {
      state.limit = limit;

      localStorage.limit = JSON.stringify(state.limit);
    },

    addResults(state, result) {
      let copy = [];
      for (let i of result) copy.push(i);
      state.results.push(copy);
    },

    clearResults(state) {
      state.results = [];
    }
  },
  actions: {

  }
})
