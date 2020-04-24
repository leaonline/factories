/* global Roles */
import { Meteor } from 'meteor/meteor'
import { FilesCollection } from 'meteor/ostrio:files'

export const getCreateFilesCollection = ({ i18n }) => {
  return ({ name, collection, ddp, roles, group, debug, maxSize, extensions, onBeforeUpload }) => {
    const maxSizeKb = maxSize / 1024000
    const checkSize = (file) => {
      if (maxSize && file.size > maxSize) {
        return i18n.get('filesCollection.maxSizeExceed', { maxSize: maxSizeKb })
      }
    }

    const allowedExtensions = extensions && extensions.join(', ')
    const checkExtension = (file) => {
      if (extensions && !extensions.includes(file.extension)) {
        return i18n.get('filesCollection.invalidExtension', { allowed: allowedExtensions })
      }
    }

    const checkUser = (context) => {
      if (!context.userId) {
        return i18n.get('filesCollection.permissionDenied')
      }
    }

    const checkRoles = (context) => {
      if (roles && group && !Roles.userIsInRoles(context.userId, roles, group)) {
        return i18n.get('filesCollection.permissionDenied')
      }
    }

    function beforeUpload (file) {
      const self = this

      const sizeChecked = checkSize(file)
      if (typeof sizeChecked !== 'undefined') return sizeChecked

      const extensionChecked = checkExtension(file)
      if (typeof extensionChecked !== 'undefined') return extensionChecked

      const userChecked = checkUser(self)
      if (typeof userChecked !== 'undefined') return userChecked

      const rolesCheck = checkRoles(self)
      if (typeof rolesCheck !== 'undefined') return rolesCheck

      const customCheck = onBeforeUpload && onBeforeUpload.call(self, file)
      if (typeof customCheck !== 'undefined') return customCheck

      return true
    }

    return new FilesCollection({
      collectionName: name,
      collection: collection,
      ddp: ddp,
      debug: Meteor.isDevelopment && debug,
      onbeforeunloadMessage: Meteor.isClient && (() => i18n.get('filesCollection.onbeforeunloadMessage')),
      onBeforeUpload: beforeUpload,
      allowClientCode: false // Disallow remove files from Client
    })
  }
}
