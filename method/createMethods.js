import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { isObject, maybe, isClass } from '../utils'

export const getCreateMethod = (ValidatedMethod, schemaResolver) => ({ name, schema, run, roles, group, isPublic }) => {
  check(ValidatedMethod, isClass)
  check(name, String)
  check(schema, isObject)
  check(run, Function)
  check(isPublic, maybe(Boolean))
  check(roles, maybe([String]))
  check(group, maybe(String))

  const validationSchema = schemaResolver(schema)
  const validate = function validate (document = {}) {
    validationSchema.validate(document)
  }

  const validatedMethod = new ValidatedMethod({ name, validate, run, roles, group, isPublic })
  if (Meteor.isDevelopment) {
    console.info(`[Method]: created ${name}`)
  }
  return validatedMethod
}

export const getCreateMethods = (ValidatedMethod, schemaResolver) => {
  const createMethod = getCreateMethod(ValidatedMethod, schemaResolver)
  return methods => {
    check(methods, [isObject])
    return methods.map(method => {
      return createMethod(method)
    })
  }
}
