import { check, Match } from 'meteor/check'
import { isObject, maybe } from '../utils'
import ValidatedMethod from './ValidatedMethod'

export const getCreateMethod = (schemaResolver, validate = true, useRoles = true)=> ({ name, schema, run, roles, group, isPublic }) => {
  check(name, String)
  check(schema, isObject)
  check(run, Function)
  check(isPublic, maybe(Boolean))
  check(roles, isPublic ? maybe([ String ]) : [ String ])
  check(group, isPublic ? maybe(String) : String)

  const validationSchema = schemaResolver(schema)
  const validate = function validate (document = {}) {
    validationSchema.validate(document)
  }

  return new ValidatedMethod({ name, validate, run, roles, group, isPublic })
}

export const getCreateMethods = schemaResolver => {
  const createMethod = getCreateMethod(schemaResolver)
  return methods => {
    check(methods, [ isObject ])
    return methods.map(method => {
      createMethod(method)
    })
  }
}
