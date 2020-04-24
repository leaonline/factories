import { Mongo } from 'meteor/mongo'

export const getCreateCollection = (schemaResolver, { attachSchema } = {}) => ({ name, schema }, { connection } = {}) => {
  const collection = new Mongo.Collection(name, { connection })
  const collectionSchema = schemaResolver(schema)
  if (attachSchema !== false && typeof collection.attachSchema === 'function') {
    collection.attachSchema(collectionSchema)
  }
  return collection
}
