const couchbackup = require('@cloudant/couchbackup')
const fs = require("fs")
const ProgressBar = require('progress')
const axios = require("axios")
const async = require("async")

const couchURL = process.argv[2]

if (couchURL == null) {
  console.log("you need to provide a valid couch url")
  process.exit(1)
}

let bar

axios.get(`${couchURL}/_all_dbs`)
  .then(response => {
    const allDbs = response.data
    console.log(`${allDbs.length} databases to download`)
    const bar = new ProgressBar('downloading backups [:bar] :percent', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: allDbs.length
    })
    async.eachSeries(
    allDbs,
    (db, next) => {
      let status = couchbackup.backup(
        `${couchURL}/${db}`,
        fs.createWriteStream(`backups/${db}.json`),
        (err, data) => {
          if (err) { console.error(`Error backing up ${db}: ${err}`) }
        }
      )

      status.on('finished', data => {
        bar.tick()
        next()
       })
    })

    setInterval(
      () => { if (bar.complete) { process.exit() } },
      100
    )
  })
  .catch(error => { console.log(error) })

