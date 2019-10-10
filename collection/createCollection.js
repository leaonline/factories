import { Mongo } from 'meteor/mongo'

export const getCreateCollection = schemaResolver => ({ name, schema }) => {
  const collection = new Mongo.Collection(name)
  const collectionSchema = schemaResolver(schema)
  collection.attachSchema(collectionSchema)
  return collection
}
