import { Meteor } from 'meteor/meteor'
import { isObject, maybe } from '../utils'
import { check } from 'meteor/check'
import { ValidatedPublication } from './ValidatedPublication'

export const getCreatePublication = schemaResolver => ({ name, schema, projection, run, roles, group, isPublic }) => {
  check(name, String)
  check(schema, isObject)
  check(run, Function)
  check(isPublic, maybe(Boolean))
  check(roles, isPublic ? maybe([ String ]) : [ String ])
  check(group, isPublic ? maybe(String) : String)

  const validationSchema = schemaResolver(schema)
  const validate = function validate (pubArgs = {}) {
    validationSchema.validate(pubArgs)
  }

  const publication = ValidatedPublication({ name, validate, run, roles, group, isPublic })
  if (Meteor.isDevelopment) {
    console.info(`[Publication]: created ${name}`)
  }
  return publication
}

export const getCreatePublications = schemaResolver => {
  const createPublication = getCreatePublication(schemaResolver)
  return methods => {
    check(methods, [ isObject ])
    return methods.map(createPublication)
  }
}
