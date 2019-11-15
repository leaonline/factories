/* eslint-env meteor */
Package.describe({
  name: 'leaonline:factories',
  version: '1.1.0',
  // Brief, one-line summary of the package.
  summary: 'Provides an easy way to create Meteor Collections, Methods, Publications using factory methods.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/leaonline/factories.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.8.1')
  api.use('ecmascript')
  api.mainModule('factories.js')
})

Package.onTest(function (api) {
  api.use('ecmascript')
  api.use('tinytest')
  api.use('leaonline:factories')
  api.mainModule('factories-tests.js')
})
