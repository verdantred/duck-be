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
    q = {};
    if(req.query.month){
      var nextMonth = new Date(req.query.month);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth = nextMonth.toISOString().split('.')[0] + 'Z';
      q.dateTime = {$gt: req.query.month, $lt: nextMonth};
      
    }
    else if(req.query.timespan){
      delta = req.query.timespan.split('--');
      delta[1] = new Date(delta[1]).toISOString().split('.')[0] + 'Z';
      q.dateTime = {$gt: delta[0], $lt: delta[1]};
    }
    if(req.query.species){
      q.species = req.query.species
    }
    if(req.query.amount){
      q.count = {$gte: req.query.amount}
    }
    //console.log(q);
    database_conn.getSightings(q, {_id: 0, __v: 0}).then((sightings) => {
      console.log(sightings)
      res.json(sightings);
    }).catch((err) => {
      console.log(err);
      res.status(500).send("Server error while fetching sightings.");
    });
    
});

app.get('/sighting/:id', (req, res) => {
    var sightingId = req.params.id;
    database_conn.getSighting({"id": sightingId}, {_id: 0, __v: 0}, {}).then((sighting) => {
      console.log(sighting);
      var status = res.statusCode;
      var content = "json";
      if(sighting == null) {
        status = 404;
        content = "";
        sighting = "Could not find sighting.";
      }
      res.status(status).contentType(content).send(sighting);
    }).catch((err) => {
      console.log(err);
      res.status(500).send("Server error while fetching a sighting.");
    });
    
});

app.put('/sighting/:id', (req, res) => {
    var sightingId = req.params.id;
    if(req.body.id){
      delete req.body.id;
    }
    database_conn.updateSighting({"id": sightingId}, req.body, {runValidators: true}).then((raw) => {
      // console.log(raw);
      var status = res.statusCode;
      if(!raw.n) {
        status = 404;
        raw = "Could not find sighting.";
      }
      else if(!raw.nModified){
        status = 400;
        raw = "Update data was invalid.";
      }
      else {
        raw = "Sighting updated successfully.";
      }
      res.status(status).send(raw);
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
    
});

app.delete('/sighting/:id', (req, res) => {
    var sightingId = req.params.id;
    database_conn.deleteSighting({"id": sightingId}).then((raw) => {
      // console.log(raw);
      var status = res.statusCode;
      if(!raw.result.n) {
        status = 404;
        raw = "Could not find sighting.";
      }
      else {
        raw = "Sighting deleted successfully.";
      }
      res.status(status).send(raw);
    }).catch((err) => {
      console.log(err);
      res.status(500).send("Server error while fetching a sighting.");
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
    database_conn.getSighting({}, {}, {sort: "-id"}).then((sighting) => {
      req.body.id = (sighting.id + 1).toString();
      database_conn.addSighting(req.body).then((sighting) => {
        console.log(sighting);
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
  database_conn.getSpecies({}, "name", {select: "-_id"}).then((species) => {
    console.log(species)
    res.json(species);
  }).catch((err) => {
    console.log(err);
    res.status(500).send("Server error while fetching species.");
  });
});

const port = process.env.PORT ? process.env.PORT : 8081;
var Collection;

// First connect to database..
var promise = database_conn.openConnection();
promise.then((db) => {
  console.log("Database online");
  // and after that is done start the server.
  const server = app.listen(port, () => {
    console.log("Server listening  port %s", port);
  });
}).catch((err) => {
  console.log(err);
});
