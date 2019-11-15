// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest'

// Import and rename a variable exported by factories.js.
import { name as packageName } from 'meteor/leaonline:factories'

// Write your tests here!
// Here is an example.
Tinytest.add('factories - example', function (test) {
  test.equal(packageName, 'factories')
})
