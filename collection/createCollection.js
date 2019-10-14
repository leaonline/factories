import { Mongo } from 'meteor/mongo'

export const getCreateCollection = schemaResolver => ({ name, schema }, { connection }) => {
  const collection = new Mongo.Collection(name, { connection })
  const collectionSchema = schemaResolver(schema)
  collection.attachSchema(collectionSchema)
  return collection
}
