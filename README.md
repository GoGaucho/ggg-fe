# ggg-fe

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Back-End API

getDeptList
query: q - quarter code, ex: 20194
JSON: string[] // a list of dept code

getGEList
query: q - quarter code
JSON: GE_COLL[]
GE_COLL: {
col: string // college code
codes: GE_CODE[] // a list of ge codes
}
GE_CODE: {
code: string // GE code
list: string[] // a list of courseID
}

getClassByDept
query: 
q - quarter code,
dept - dept code, note: please replace white space with _
JSON: string[] // a list of courseID

getClassByID
query:
q - quarter code
id - courseID // note: please remove all white spaces and replace & with $
JSON: UCSB Class Object