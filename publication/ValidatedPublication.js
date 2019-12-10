/* global Roles */
import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'

export const ValidatedPublication = ({ name, validate, run, roles, group, isPublic }) => {
  const publication = function (...args) {
    check(args, Match.Where(validate))
    // we use our own validation using the schema
    // validator from the createPublication method

    const self = this
    const { userId } = self

    // first validate permissions
    if (!isPublic && !Roles.userIsInRole(userId, roles, group)) {
      console.info('[Publication]: skip due to permission denied.')
      return self.ready()
    }

    const cursor = run.call(self, ...args)

    if (cursor) {
      return cursor
    } else {
      return self.ready()
    }
  }
  publication.name = name
  Meteor.publish(name, publication)
  return publication
}
