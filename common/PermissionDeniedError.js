import { Meteor } from 'meteor/meteor'

export class PermissionDeniedError extends Meteor.Error {
  static get NO_USER () {
    return 'errors.permissionDenied.noUser'
  }

  static get NOT_IN_ROLES () {
    return 'errors.permissionDenied.notInRoles'
  }

  constructor (reason, details) {
    super(PermissionDeniedError.TITLE, reason, details)
  }
}
