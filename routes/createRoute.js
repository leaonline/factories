import { Meteor } from 'meteor/meteor'
import { WebApp } from 'meteor/webapp'
import { check, Match } from 'meteor/check'
import { isObject } from '../utils'

const httpMethods = [ 'get', 'post', 'put', 'delete', 'options' ]
const isHttpMethod = Match.Where(x => httpMethods.includes(x))
const webApp = WebApp.connectHandlers

const handleError = function ({ error, title, description, code, res }) {
  console.error(code, title, description)
  console.error(error)
  res.writeHead(code, { 'Content-Type': 'application/json' })
  const body = JSON.stringify({
    title: title,
    description: description,
    info: error && error.message
  }, null, 0)
  res.end(body)
}

export const getCreateRoutes = (schemaResolver, authenticateHandlers, debug) => {
  const createRoute = getCreateRoute(schemaResolver, authenticateHandlers, debug)
  return routes => {
    check(routes, [ isObject ])
    return routes.map(route => {
      return createRoute(route)
    })
  }
}

export const getCreateRoute = (schemaResolver, allowedOrigins, debug) => {
  check(schemaResolver, Function)
  check(allowedOrigins, [String])

  return ({ path, schema, method, run, hasNext }) => {
    check(path, String)
    check(schema, isObject)
    check(method, isHttpMethod)
    check(run, Function)
    check(allowedOrigins, [ String ])
    check(hasNext, Match.Maybe(Boolean))

    const validationSchema = schemaResolver(schema)
    const validate = function (...args) {
      validationSchema.validate(...args)
    }

    const allowMethods = `${method.toUpperCase()}, OPTIONS`

    const handler = function (req, res, next) {
      // verify the origin first
      const { origin } = req.headers
      if (allowedOrigins.includes(origin)) {
        const originIndex = allowedOrigins.indexOf(origin)
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[ originIndex ])
        res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token')
      }

      // then validate the method
      res.setHeader('Access-Control-Allow-Methods', allowMethods)
      if (!allowMethods.includes(req.method.toUpperCase())) {
        return handleError({
          error: new Error(''),
          title: `Method Not Allowed`,
          description: `The request used an unallowed method. (${req.method})`,
          code: 405
        })
      }

      // then we validate the query / body
      let query

      try {
        switch (method.toLowerCase()) {
          case 'post':
            query = req.body
            break
          case 'get':
            query = req.query
            break
          default:
            query = {}
            break
        }
        validate(query || {})
      } catch (validationError) {
        return handleError({
          res,
          error: validationError,
          code: 400,
          title: 'Bad Request',
          description: 'Malformed query'
        })
      }

      // then we run the context
      let result
      try {
        const tmp = run(query)
        result = JSON.stringify(tmp)
      } catch (invocationError) {
        return handleError({
          res,
          error: invocationError,
          code: 500,
          title: 'Internal Server Error',
          description: 'An unintended error occurred.'
        })
      }

      // if no result has been found, return 404
      if (typeof result === 'undefined' || result === null) {
        return handleError({
          res,
          error: null,
          code: 404,
          title: 'Not Found',
          description: 'The requested resource could not be found.'
        })
      }

      if (hasNext) {
        return next()
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(result)
    }

    switch (method) {
      case 'get':
        webApp.get(path, handler)
        break
      case 'post':
        webApp.post(path, handler)
        break
      default:
        throw new Error(`Unknown or unimplemented method <${method}>`)
    }
    if (Meteor.isDevelopment) {
      console.info(`[HTTP]: created route: [${method}] ${path}`)
    }
    return handler
  }
}
