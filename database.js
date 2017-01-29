assert = require('assert')

var mongoose = require('mongoose');
var Sighting;

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

const speciesNames = knownSpecies.map((obj)=>{
    return obj.name;
});

const isoDateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})[+-](\d{2})\:(\d{2})/;

var sightSchema = mongoose.Schema({
    species: {
        type: String,
        enum: speciesNames
    },
    description: String,
    dateTime: String,
    count: Number
});

const validator = { $and:
    [
        { species: { $in: speciesNames } },
        { description: { $type: "string" } },
        { dateTime: { $regex: isoDateRegex } },
        { description: { $type: "number" } }
    ]
}

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
            resolve(Sighting);
        });
    })
}

function close(){
    // Close connection
    if(dbOnline){
        db.close();
    }
}

function get(q){
    return Sighting.find(q);
}

function getSpecies(){
    return knownSpecies;
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
    open : open,
    close: close,
    get: get,
    getSpecies: getSpecies,
    add: add
}

module.exports.database = db;