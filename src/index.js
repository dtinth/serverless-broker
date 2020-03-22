require('isomorphic-fetch')
const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const port = 3000

const env = name => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

const SERVERLESS_BROKER_JWT_SECRET = env('SERVERLESS_BROKER_JWT_SECRET')
const SERVERLESS_BROKER_BASE_URL = env('SERVERLESS_BROKER_BASE_URL')

app.use(
  require('express-jwt')({
    secret: SERVERLESS_BROKER_JWT_SECRET,
    credentialsRequired: true,
    getToken: function fromHeaderOrQuerystring(req) {
      if (
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer'
      ) {
        return req.headers.authorization.split(' ')[1]
      } else if (req.query && req.query.token) {
        return req.query.token
      }
      return null
    },
  }),
)

app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: false }))

const dynamicRequire = require

const runtime = {
  baseURL: SERVERLESS_BROKER_BASE_URL,
  getToken: ({ iss, sub } = {}) => {
    return jwt.sign({ iss, sub }, SERVERLESS_BROKER_JWT_SECRET, {
      expiresIn: '1h',
    })
  },
  require: id => {
    switch (id) {
      case 'bson-objectid':
        return require('bson-objectid')
      case 'discord.js':
        return require('discord.js')
      case 'glob':
        return require('glob')
      case 'socket.io-client':
        return require('socket.io-client')
      default:
        return dynamicRequire(id)
    }
  },
  app,
}

dynamicRequire(
  require('path').resolve(
    process.env.HOME,
    '.config/serverless-broker/init.js',
  ),
)(runtime)

app.get('/', (req, res) => res.send('😸'))

app.listen(port, () =>
  console.log(`serverless-broker listening on port ${port}!`),
)
