const app = require('express')();
const bodyParser = require('body-parser');
expressValidator = require('express-validator')
var database_conn = require('./database').database;

const species = [
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

app.use(bodyParser.json());
app.use(expressValidator([]));

app.get('/sightings', (req, res) => {
  
    database_conn.get({}).then((sightings) => {
      console.log(sightings)
      res.json(sightings);
    }).catch((err) => {
      console.log(err);
    });
    
});

app.post('/sightings', (req, res) => {
  req.sanitize('species').trim();
  req.sanitize('species').escape();
  req.sanitize('description').trim();
  req.sanitize('description').escape();
  req.sanitize('dateTime').trim();
  req.sanitize('dateTime').escape();
  req.validate('dateTime').isISO8601();
  
  database_conn.get({}).then((sightings) => {
    req.body.id = (sightings.length + 1).toString();
    database_conn.add(req.body).then((sighting) => {
      console.log(sighting)
    res.json(sighting);
    }).catch((err) => {
      console.log(err);
    });
  }).catch((err) => {
    console.log(err);
  });
  
});

app.get('/species', (req, res) => {
  var species = database_conn.getSpecies();
  console.log(species)
  res.json(species);
});

const port = process.env.PORT ? process.env.PORT : 8081;
var Collection;

// First connect to database..
var promise = database_conn.open();
promise.then((db) => {
  console.log("Database online");
  Collection = db;
  // and after that is done start the server.
  const server = app.listen(port, () => {
    console.log("Server listening  port %s", port);
  });
}).catch((err) => {
  console.log(err);
});
