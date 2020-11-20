#!/usr/bin/env node

const {resolve, basename} = require('path')
const dir = process.cwd()

const express = require('express')

const port = process.argv[2] || 9090

express()
  .use(express.static(resolve(__dirname, '..')))
  .use('/' + basename(dir), express.static(dir))
  .listen(port, () => console.log(`Library serving /${basename(dir)} from ${dir} on ${port}`))