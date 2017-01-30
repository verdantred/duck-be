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

app.use(bodyParser.json());
app.use(expressValidator([]));

app.get('/sightings', (req, res) => {
  
    database_conn.get({}).then((sightings) => {
      console.log(sightings)
      res.json(sightings);
    }).catch((err) => {
      console.log(err);
      res.status(500).send("Server error while fetching sightings.");
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

  req.getValidationResult().then((result) => {
    if(!result.isEmpty()){
      console.log(result);
      res.status(400).send("Sighting validation failed: dateTime is not a valid ISO-8601 date [YYYY]-[MM]-[DD]T[hh]:[mm]:[ss]Z.");
      return;
    }
    database_conn.get({}).then((sightings) => {
      req.body.id = (sightings.length + 1).toString();
      console.log(req.body);
      database_conn.add(req.body).then((sighting) => {
        res.json(sighting);
      }).catch((err) => {
        console.log(err);
        if(err.name == "ValidationError"){
          var message = err.message + ":";
          for(prop in err.errors) {
            message = message + " " + err.errors[prop].message;
          }
          res.status(400).send(message);
        }
        else {
          res.status(500).send("Server error while fetching sightings.");
        }
      });
    }).catch((err) => {
      console.log(err);
      res.status(500).send("Server error while fetching sightings.");
    });
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
  console.log(db);
  // and after that is done start the server.
  const server = app.listen(port, () => {
    console.log("Server listening  port %s", port);
  });
}).catch((err) => {
  console.log(err);
});
