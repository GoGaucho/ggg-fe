import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const init = (key, def) => {
  const raw = localStorage.getItem(key);
  if (!raw) return def;
  if (key == "quarter") return raw;
  const par = JSON.parse(raw);
  const date = o => o.timerange = o.timerange.map(e => new Date(e));
  if (key == "limit") date(par);
  if (key == "events") par.forEach(x => date(x));
  return par;
};

export default new Vuex.Store({
  state: {
    quarter: init("quarter", ""),
    selected: init(`${init("quarter", "")}-selected`, []),
    events: init("events", []),
    limit: init("limit", {
      timerange: [new Date(0, 0, 0, 8, 0), new Date(0, 0, 0, 22, 0)],
      break: 10,
    }),
    inclPref: init("inclPref", {}),
    loadingMode: "",
    loadingList: { list: [], ge: [] },
    courseList: { list: [], ge: [] },
    checkedEnrollCode: [],
    course: null,
    results: [],
    courseDetails: { data: {}, map: {}, rev: {}, periods: {}, rev: {}, s2c: {} }
  },
  mutations: {
    setQuarter(state, quarter) {
      if (state.quarter != quarter) {
        state.selected = [];
        state.selected = init(`${quarter}-selected`, []);
      }
      state.quarter = quarter;

      localStorage.quarter = quarter;
    },

    addSelected(state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) return;
      }
      state.selected.push(course);
      localStorage[`${state.quarter}-selected`] = JSON.stringify(state.selected);
    },

    removeSelected(state, course) {
      for (let i in state.selected) {
        if (state.selected[i] === course) {
          state.selected.splice(i, 1);
        }
      }
      localStorage[`${state.quarter}-selected`] = JSON.stringify(state.selected);
    },

    setCourseList(state, list) {
      if (state.loadingMode.length) state.loadingList = { list: list.list, ge: list.ge };
      else state.courseList = { list: list.list, ge: list.ge };
    },

    setResultList(state, list) {
      state.courseList = { list: list.list, ge: list.ge };
    },

    pushResultList(state, item) {
      state.courseList.list.push(item);
    },

    setSelectorMode(state, mode) {
      state.loadingMode = mode;
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
      state.results.push([...result]);
    },

    clearResults(state) {
      state.results = [];
    },

    setCourseDetail(state, data) {
      state.courseDetails = data;
    },

    setCheckedEC(state, list) {
      state.checkedEnrollCode = list;
    },

    setInclPref(state, data) {
      // status == 0: default
      // status == 1: custom
      if (data.q && !state.inclPref[data.q])
        state.inclPref[data.q] = {};
      if (data.id)
        state.inclPref[data.q][data.id] = { status: data.status, codes: data.codes };
      if (data.save)
        localStorage.inclPref = JSON.stringify(state.inclPref);
    }
  },
  actions: {

  }
})
