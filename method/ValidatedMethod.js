/* global Roles */
import { Meteor } from 'meteor/meteor'
import { PermissionDeniedError } from '../common/PermissionDeniedError'

export const PermissionsMixin = function (options) {
  const runFct = options.run
  options.run = function run (...args) {
    const exception = options.isPublic || (options.permission && options.permission(...args))
    if (exception) {
      return runFct.call(this, ...args)
    }

    // user level permission
    const { userId } = this
    if (!userId || !Meteor.users.findOne(userId)) {
      throw new PermissionDeniedError(PermissionDeniedError.NO_USER)
    }

    return runFct.call(this, ...args)
  }
  return options
}

export const RoleMixin = function (options) {
  if (options.roles) {
    const runFct = options.run
    options.run = function run (...args) {
      const { userId } = this
      const { roles } = options
      const { group } = options

      // CHECK ROLES
      if (!Roles.userIsInRole(userId, roles, group)) {
        throw new PermissionDeniedError(PermissionDeniedError.NOT_IN_ROLES)
      }

      return runFct.call(this, ...args)
    }
  }

  return options
}

export const ErrorLogMixin = function (options) {
  // OVERRIDE RUN
  if (options.log) {
    const { log } = options
    const originalRun = options.run
    options.run = function (...args) {
      try {
        return originalRun.call(this, ...args)
      } catch (error) {
        log.call(this, error)
        throw error
      }
    }
  }
  return options
}
