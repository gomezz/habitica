// User.js
// =======
// Defines the user data model (schema) for use via the API.

// Dependencies
// ------------
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var helpers = require('habitrpg-shared/script/helpers');
var _ = require('lodash');
var TaskSchema = require('./task').schema;

// User Schema
// -----------

var UserSchema = new Schema({
  // ### UUID and API Token
  _id: {
    type: String,
    'default': helpers.uuid
  },
  apiToken: {
    type: String,
    'default': helpers.uuid
  },

  // ### Mongoose Update Object
  // We want to know *every* time an object updates. Mongoose uses __v to designate when an object contains arrays which
  // have been updated (http://goo.gl/gQLz41), but we want *every* update
  _v: {
    type: Number,
    'default': 0
  },
  achievements: {
    originalUser: Boolean,
    helpedHabit: Boolean,
    ultimateGear: Boolean,
    beastMaster: Boolean,
    streak: Number
  },
  auth: {
    facebook: Schema.Types.Mixed,
    local: {
      email: String,
      hashed_password: String,
      salt: String,
      username: String
    },
    timestamps: {
      created: {
        type: Date,
        'default': Date.now
      },
      loggedin: Date
    }
  },

  backer: {
    tier: Number,
    admin: Boolean,
    npc: String,
    contributor: String,
    tokensApplied: Boolean
  },

  balance: Number,
  habitIds: Array,
  dailyIds: Array,
  todoIds: Array,
  rewardIds: Array,
  filters: {type: Schema.Types.Mixed, 'default': {}},

  purchased: {
    ads: {type: Boolean, 'default': false},
    skin: {type: Schema.Types.Mixed, 'default': {}}, // eg, {skeleton: true, pumpkin: true, eb052b: true}
    hair: {type: Schema.Types.Mixed, 'default': {}}
  },

  flags: {
    customizationsNotification: {type: Boolean, 'default': false},
    showTour: {type: Boolean, 'default': true},
    dropsEnabled: {type: Boolean, 'default': false},
    itemsEnabled: {type: Boolean, 'default': false},
    newStuff: {type: Boolean, 'default': false},
    rewrite: {type: Boolean, 'default': true},
    partyEnabled: Boolean, // FIXME do we need this?
    petsEnabled: {type: Boolean, 'default': false},
    rest: {type: Boolean, 'default': false} // fixme - change to preferences.resting once we're off derby
  },
  history: {
    exp: [
      {
        date: Date,
        value: Number
      }
    ],
    todos: [
      {
        data: Date,
        value: Number
      }
    ]
  },
  /* FIXME remove?*/

  invitations: {
    guilds: {type: Array, 'default': []},
    party: Schema.Types.Mixed
  },
  items: {
    armor: Number,
    weapon: Number,
    head: Number,
    shield: Number,

    /*FIXME - tidy this up, not the best way to store current pet*/

    currentPet: {
      /*Cactus*/

      text: String,
      /*Cactus*/

      name: String,
      /*3*/

      value: Number,
      /*"Find a hatching potion to pour on this egg, and one day it will hatch into a loyal pet.",*/

      notes: String,
      /*Skeleton*/

      modifier: String,
      /*Cactus-Skeleton*/

      str: String
    },

    eggs: [
      {
        // example: You've found a Wolf Egg! Find a hatching potion to pour on this egg, and one day it will hatch into a loyal pet
        dialog: String,
        // example: Wolf
        name: String, 
        // example: Find a hatching potion to pour on this egg, and one day it will hatch into a loyal pet.
        notes: String,
        // example: Wolf 
        text: String, 
        /* type: String, //Egg // this is forcing mongoose to return object as "[object Object]", but I don't think this is needed anyway? */
        // example: 3
        value: Number 
      }
    ],
    hatchingPotions: Array, // ["Base", "Skeleton",...]
    lastDrop: {
      date: {type: Date, 'default': Date.now},
      count: {type: Number, 'default': 0}
    },
    // ["BearCub-Base", "Cactus-Base", ...]

    pets: Array
  },
  // FIXME store as Date?

  lastCron: {
    type: Date,
    'default': Date.now
  },
  // FIXME remove?

  party: {
    //party._id // FIXME make these populate docs?
    current: String, // party._id
    invitation: String, // party._id
    lastMessageSeen: String,
    leader: Boolean
  },
  preferences: {
    armorSet: String,
    dayStart: {type:Number, 'default': 0},
    gender: {type:String, 'default': 'm'},
    hair: {type:String, 'default':'blond'},
    hideHeader: {type:Boolean, 'default':false},
    showHelm: {type:Boolean, 'default':true},
    skin: {type:String, 'default':'white'},
    timezoneOffset: Number
  },
  profile: {
    blurb: String,
    imageUrl: String,
    name: String,
    websites: Array // styled like --> ["http://ocdevel.com" ]
  },
  stats: {
    hp: Number,
    exp: Number,
    gp: Number,
    lvl: Number
  },
  tags: [
    {
      // FIXME use refs?
      id: String,
      name: String
    }
  ],

  challenges: [{type: 'String', ref:'Challenge'}],

  habits: [TaskSchema],
  dailys: [TaskSchema],
  todos: [TaskSchema],
  rewards: [TaskSchema],

}, {
  strict: true,
  minimize: false // So empty objects are returned
});

// Legacy Derby Function?
// ----------------------
// Derby requires a strange storage format for somethign called "refLists". Here we hook into loading the data, so we
// can provide a more "expected" storage format for our various helper methods. Since the attributes are passed by reference,
// the underlying data will be modified too - so when we save back to the database, it saves it in the way Derby likes.
// This will go away after the rewrite is complete

//FIXME use this in migration
/*function transformTaskLists(doc) {
  _.each(['habit', 'daily', 'todo', 'reward'], function(type) {
    // we use _.transform instead of a simple _.where in order to maintain sort-order
    doc[type + "s"] = _.reduce(doc[type + "Ids"], function(m, tid) {
      if (!doc.tasks[tid]) return m; // FIXME tmp hotfix, people still have null tasks?
      if (!doc.tasks[tid].tags) doc.tasks[tid].tags = {}; // FIXME remove this when we switch tasks to subdocs and can define tags default in schema
      m.push(doc.tasks[tid]);
      return m;
    }, []);
  });
}*/

UserSchema.methods.toJSON = function() {
  var doc = this.toObject();
  doc.id = doc._id;

  // FIXME? Is this a reference to `doc.filters` or just disabled code? Remove?
  doc.filters = {};
  doc._tmp = this._tmp; // be sure to send down drop notifs

  // TODO why isnt' this happening automatically given the TaskSchema.methods.toJSON above?
  _.each(['habits','dailys','todos','rewards'], function(type){
    _.each(doc[type],function(task){
      task.id = task._id;
    })
  })

  return doc;
};

UserSchema.virtual('tasks').get(function () {
  var tasks = this.habits.concat(this.dailys).concat(this.todos).concat(this.rewards);
  var tasks = _.object(_.pluck(tasks,'id'), tasks);
  return tasks;
});

 // FIXME - since we're using special @post('init') above, we need to flag when the original path was modified.
 // Custom setter/getter virtuals?

UserSchema.pre('save', function(next) {
  //this.markModified('tasks');

  if (!this.profile.name) {
    var fb = this.auth.facebook;
    this.profile.name =
      (this.auth.local && this.auth.local.username) ||
      (fb && (fb.displayName || fb.name || fb.username || (fb.first_name && fb.first_name + ' ' + fb.last_name))) ||
      'Anonymous';
  }

  //our own version incrementer
  this._v++;
  next();
});

module.exports.schema = UserSchema;
module.exports.model = mongoose.model("User", UserSchema);