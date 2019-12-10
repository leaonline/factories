import { Meteor } from 'meteor/meteor'
import { WebApp } from 'meteor/webapp'
import { check, Match } from 'meteor/check'
import { isObject } from '../utils'

const httpMethods = ['get', 'post', 'put', 'delete', 'options']
const isHttpMethod = Match.Where(x => httpMethods.includes(x))
const webApp = WebApp.connectHandlers

const handleError = function ({ error, title, description, code, res }) {
  console.error(code, title, description)
  console.error(error)
  res.setHeader('Content-Type', 'application/json')
  res.writeHead(code)
  const body = JSON.stringify({
    title: title,
    description: description,
    info: error && error.message
  }, null, 0)
  res.end(body)
}

export const getCreateRoutes = ({ schemaResolver, allowedOrigins, xAuthToken, debug }) => {
  const createRoute = getCreateRoute({ schemaResolver, allowedOrigins, xAuthToken, debug })
  return routes => {
    check(routes, [isObject])
    return routes.map(route => {
      return createRoute(route)
    })
  }
}

const log = (...args) => Meteor.isDevelopment && console.log(...args)

export const getCreateRoute = ({ schemaResolver, allowedOrigins, debug, xAuthToken }) => {
  check(schemaResolver, Function)
  check(allowedOrigins, [String])

  const originRegexps = allowedOrigins.map(str => new RegExp(str, 'i'))
  const isValidOrigin = origin => originRegexps.some(regExp => regExp.test(origin))

  return ({ path, schema, method, run, hasNext, tokenRequired }) => {
    check(path, String)
    check(schema, isObject)
    check(method, isHttpMethod)
    check(run, Function)
    check(allowedOrigins, [String])
    check(hasNext, Match.Maybe(Boolean))
    check(tokenRequired, Match.Maybe(Boolean))

    const validationSchema = schemaResolver(schema)
    const validate = function (...args) {
      validationSchema.validate(...args)
    }

    const allowMethods = `${method.toUpperCase()}, OPTIONS`
    const executionContext = Meteor.bindEnvironment(run)

    const handler = function (req, res, next) {
      if (debug) {
        log(path)
        log(req.method)
        log(req.headers)
        log(req.query)
        log(req.body)
      }
      // verify the origin first
      const { origin } = req.headers
      if (isValidOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token, Accept')
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      } else {
        console.warn(`${method} ${path}: skip not allowed origin [${origin}]`)
        console.log(allowedOrigins)
        console.log(req.headers)
      }

      // then validate the method
      res.setHeader('Access-Control-Allow-Methods', allowMethods)
      if (!allowMethods.includes(req.method.toUpperCase())) {
        return handleError({
          res,
          error: new Error(''),
          title: 'Method Not Allowed',
          description: `The request used an unallowed method. (${req.method})`,
          code: 405
        })
      }

      // end the request here, if it's a preflight
      if (req.method.toLowerCase() === 'options') {
        res.writeHead(200)
        return res.end()
      }

      // validate the xAuthToken, if defined
      if (tokenRequired && xAuthToken !== req.headers['x-auth-token']) {
        return handleError({
          res,
          error: new Error('permission denied'),
          title: 'Permission denied',
          description: 'You are not allowed to request this method',
          code: 403
        })
      }

      // then we validate the query / body or end
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
        const tmp = executionContext.call(this, query)
        result = JSON.stringify(tmp || {})
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
      return res.end(result)
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
