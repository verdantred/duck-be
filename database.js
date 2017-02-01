assert = require('assert')

var mongoose = require('mongoose');
var Sighting;
var Species;

// Connection URL. In production this should not be visible in a public repository.
const url = 'mongodb://verdant:salainensana@ds135049.mlab.com:35049/bongaukset';

const knownSpecies = [
{
    name: 'mallard'
  },
  {
    name: 'redhead'
  },
  {
    name: 'gadwall'
  },
  {
    name: 'canvasback'
  },
  {
    name: 'lesser scaup'
  }
];

var sightings = [
  {
    id: '1',
    species: 'gadwall',
    description: 'All your ducks are belong to us',
    dateTime: '2016-10-01T01:01:00Z',
    count: 1
  },
  {
    id: '2',
    species: 'lesser scaup',
    description: 'This is awesome',
    dateTime: '2016-12-13T12:05:00Z',
    count: 5
  },
  {
    id: '3',
    species: 'canvasback',
    description: '...',
    dateTime: '2016-11-30T23:59:00Z',
    count: 2
  },
  {
    id: '4',
    species: 'mallard',
    description: 'Getting tired',
    dateTime: '2016-11-29T00:00:00Z',
    count: 18
  },
  {
    id: '5',
    species: 'redhead',
    description: 'I think this one is called Alfred J.',
    dateTime: '2016-11-29T10:00:01Z',
    count: 1
  },
  {
    id: '6',
    species: 'redhead',
    description: 'If it looks like a duck, swims like a duck, and quacks like a duck, then it probably is a duck.',
    dateTime: '2016-12-01T13:59:00Z',
    count: 1
  },
  {
    id: '7',
    species: 'mallard',
    description: 'Too many ducks to be counted',
    dateTime: '2016-12-12T12:12:12Z',
    count: 100
  },
  {
    id: '8',
    species: 'canvasback',
    description: 'KWAAK!!!1',
    dateTime: '2016-12-11T01:01:00Z',
    count: 5
  }
];

const speciesNames = knownSpecies.map((obj)=>{
    return obj.name.toString();
});

const isoDateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})[+-](\d{2})\:(\d{2})/; // Incomplete regex for ISO dates, not in use

var sightSchema = mongoose.Schema({
    id: Number,
    species: {
        type: String,
        enum: speciesNames
    },
    description: String,
    dateTime: String,
    count: Number
});

var speciesSchema = mongoose.Schema({
    name: String
});

function open(){

    return new Promise((resolve, reject) => {
        mongoose.connect(url);
        var conn = mongoose.connection;
        conn.on('error', (err)=>{
            reject(err);
        });
        conn.once('open', ()=>{
            console.log("Connected correctly to Mongo database server");
            var dbOnline = true;
            Sighting = mongoose.model("Sighting", sightSchema);
            Species = mongoose.model("Species", speciesSchema);
            sightingPromise = Sighting.count({});
            speciesPromise = Species.count({});
            Promise.all([sightingPromise, speciesPromise]).then((values) => {
                if(values[0] == 0) sightingPromise = Sighting.insertMany(sightings);
                if(values[1] == 0) speciesPromise = Species.insertMany(knownSpecies);
                Promise.all([sightingPromise, speciesPromise]).then((values) => {
                    resolve(Sighting);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    })
}

function close(){
    // Close connection
    if(dbOnline){
        db.close();
    }
}

function get(q, o){
    return Sighting.find(q, o);
}

function getOne(q, c, o){
    return Sighting.findOne(q, c, o);
}

function updateOne(q, body, o){
    return Sighting.update(q, { $set: body}, o);
}

function removeOne(q, body){
    return Sighting.remove(q);
}

function getSpecies(){
    return Species.find({});
}

function add(body){
    return new Promise((resolve, reject) => {
        var newSighting = new Sighting(body);
        newSighting.save((err, newSighting) => {
            if(err) {
                reject(err);
            }
            resolve(newSighting);
        });
    });
    
}

var db = {
    openConnection : open,
    closeConnection: close,
    getSightings: get,
    getSighting: getOne,
    updateSighting: updateOne,
    deleteSighting: removeOne,
    getSpecies: getSpecies,
    addSighting: add
}

module.exports.database = db;