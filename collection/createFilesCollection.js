import { FilesCollection } from 'meteor/ostrio:files'

export const createFilesCollection = ({ name, collection, ddp, allowedOrigins, debug, onAfterUpload }) => {
  return new FilesCollection({
    collectionName: name,
    collection: collection,
    ddp: ddp,
    debug: debug,
    allowedOrigins: allowedOrigins,
    onAfterUpload: onAfterUpload,
    allowClientCode: false, // Disallow remove files from Client
  })
}