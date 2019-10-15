import { WebApp } from 'meteor/webapp'
import { check, Match } from 'meteor/check'

export const getCreateGETRoute = schemaResolver => {
  check(schemaResolver, Function)
  return ({ path, methods, schema, roles, group, isPublic, returns }) => {
    const validationSchema = schemaResolver(schema)
    const validate = function (...args) {
      validationSchema.validate(...args)
    }
    const methodsStr = methods.join(', ')
    WebApp.get(path, function () {

    })
  }
}
throw new Error('continue here')