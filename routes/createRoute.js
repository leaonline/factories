import { WebApp } from 'meteor/webapp'
import { check, Match } from 'meteor/check'
import { isObject } from '../utils'

const httpMethods = [ 'get', 'post', 'put', 'delete', 'options' ]
const isHttpMethod = Match.Where(x => httpMethods.includes(x))
const webApp = WebApp.connectHandlers

const handleError = function ({ error, title, description, code, res }) {
  console.log(code, title, description)
  console.error(error)
  res.writeHead(code, { 'Content-Type': 'application/json' })
  const body = JSON.stringify({
    title: title,
    description: description,
    info: error && error.message
  }, null, 0)
  res.end(body)
}

export const getCreateRoutes = (schemaResolver, allowedOrigins) => {
  const createRoute = getCreateRoute(schemaResolver, allowedOrigins)
  return routes => {
    check(routes, [ isObject ])
    return routes.map(route => {
      return createRoute(route)
    })
  }
}

export const getCreateRoute = (schemaResolver, allowedOrigins) => {
  check(schemaResolver, Function)
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

    const allowHeader = `${method.toUpperCase()}, OPTIONS`

    const handler = function (req, res, next) {
      res.setHeader('Access-Control-Allow-Methods', allowHeader)

      // we check first for any unregular origins
      const originIndex = allowedOrigins.indexOf(req.headers.origin)
      if (originIndex > -1 && originIndex < allowedOrigins.length) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[ originIndex ])
      } else {
        // FIXME IMPORTANT
        // LOG ATTEMPT FROM ANY OTHER ORIGIN
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
