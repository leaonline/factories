# Leaonline Factories

Provides an easy way to create Meteor Collections, Methods, Publications using factory methods.

## History

- 1.2.0
 - reorganized package structure
 - code splitting for server and client
 - updated `ostrio:files` to 1.14.1

## How to use this package

First install this package

```bash
$ meteor add leaonline:factories
``` 

Then you need to initialize each new factory with respective content to inject.
The following section describes the respective steps for each factory.

### Create Mongo.Collection

There are two types of collections: Mongo collections and Files collections.
To create a Mongo Collection factory you need to inject a schema resolver like so:

```javascript
import SimpleSchema from 'simpl-schema'

const schemaResolver = (schema, options) => new SimpleSchema(schema, options)
const createCollection = getCreateCollection(schemaResolver, { attachSchema: true })
const MyCollection = createCollection({
  name: 'myCollection',
  schema: {
    foo: String,
    bar: Number
  }
})
``` 

If you have `aldeed:collection2` installed, it will attach the schema, unless you pass the option
`{ attachSchema: false }`.

### Create FilesCollection

Files collections are currently implemented using [`ostrio:files`](https://github.com/VeliovGroup/Meteor-Files)
The factory functions require different parameters on server and client. However, since the parameters are wrapped
in an object you may pass in whatever you like.

Note that the current factory function implementation uses `GridFSBucket` in order to store
the file data in GridFS. In order to create a bucket, please follow the [new GridFS guide](https://github.com/VeliovGroup/Meteor-Files/wiki/GridFS-Bucket-Integration).

#### Server

```javascript
const createFilesCollection = getCreateFilesCollection({ i18n, fs, bucket, createObjectId })
const MyFilesCollection = createFilesCollection({ 
  name, 
  collection, 
  ddp, 
  allowedOrigins, 
  roles, 
  group, 
  debug, 
  maxSize, 
  extensions, 
  onBeforeUpload, 
  onAfterUpload 
})
```

#### Client

```javascript
const createFilesCollection = getCreateFilesCollection({ i18n })
const MyFilesCollection = createFilesCollection({  name, collection, ddp, roles, group, debug, maxSize, extensions, onBeforeUpload })
```

### Create ValidatedMethod

Validated Meteor Methods can be created as with [`mdg:validated-method`](https://guide.meteor.com/security.html#validated-method)
but with extended options (implemented via mixins):

```javascript
import SimpleSchema from 'simpl-schema'

const validate = true
const useRoles = true
const schemaResolver = (schema, options) => new SimpleSchema(schema, options)
const createMethod = getCreateMethod(schemaResolver, validate, useRoles)
const validatedMethod = createMethod({
  name: 'updatePost',
  schema: {
    postId: String,
    text: String
  },
  roles: ['edit-posts'],
  group: 'editors',
  isPublic: false,
  run: function({ postId, text }) {
    return Posts.update(postId, { $set: { text }})
  }
})
```

The following parameters are defined:

`name`

Name of the method as when using `Meteor.call`

`schema`

A definitions object, that is validated using your schemaResolver.
The example uses `SimpleSchema` but you could also use a schema resolver, that is based
on other validations (for examples Meteor's builtin `check` or 3rd party npm packages).

`roles`

If the method is restricted to certain roles you can pass in an array of roles.
See `alanning:roles` for further documentation.

`group`

This is the group field for `alanning:roles`

`isPublic`

If this is true, there won't be any check if the current method is executed by a valid registered account.
Otherwise the check will throw on any `this.userId` value that does not match in `Meteor.users`.

`run`

This is basically the part that executes the method's core business logic.
Runs only after all checks have been passed!

### Create ValidatedPublication

Validated publications are a custom approach to create publications the same way as validated methods.

```javascript
import SimpleSchema from 'simpl-schema'

const schemaResolver = (schema, options) => new SimpleSchema(schema, options)
const createPublication = getCreatePublication(schemaResolver)
createPublication({
  name: 'allPosts',
    schema: {},
    roles: ['read-posts'],
    group: 'editors',
    isPublic: false,
    run: function() {
      return Posts.find()
    }
}) 
```

### Create HTTP Route (via WebApp connect handlers)

While there are frameworks like `express` to create HTTP / REST routes, we have
created a factory, that builts upon Meteor's internal `webapp` (connect) api.

```javascript

const createRoute = getCreateRoute({ schemaResolver, allowedOrigins, debug, xAuthToken })
createRoute({
  path: '/posts', 
  schema: {
    postId: String
  }, 
  method: 'get', 
  hasNext: false, 
  tokenRequired: false,
  run: function({ postId }) {
    return Posts.findOne(postId)
  }
})
```

Sidenode on the `x-auth-token`: This is an inofficial header we use to fast-authenticate requests.
The token should be a secret that only this application server and your consumer (be it a client or external server) 
possess. Note the following discussion on get requests: https://stackoverflow.com/questions/2629222/are-querystring-parameters-secure-in-https-http-ssl
 

## Rate limiting

The functionality for rate limiting is separated from the factories. This gives you the freedom to decide what, when
and how to rate limit the factory products. The following methods are provided by rate limiting:

### runRateLimiter

Call this **after all products have been added** for rate limiting using the methods below.

### rateLimitMethod

Rate limit a single method.

### rateLimitMethods

Rate limit a list of methods

### rateLimitPublications

Rate limit a single publication

### rateLimitAccounts

Rate limit builtin Meteor and accounts functions 

## Contributing

This package is under active development and any contribution is very welcomed!

## License

MIT, see [LICENSE](./LICENSE)


