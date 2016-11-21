const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const server = app.listen(process.env.PORT || 80);

const fs = require('fs');
const file = 'ramzi_needs_a_noise_ring.db';
const exists = fs.existsSync(file);

if(!exists) {
  console.log('Creating DB file.');
  fs.openSync(file, 'w');
}

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

db.serialize(function() {
    if(!exists) {
        db.run('CREATE TABLE bins (id INTEGER, data TEXT)');

        var bins = [
            {
                'id': 1,
                'coord': [-37.813611, 144.963256],
                'full': 10,
                'level': 'G'
            },
            {
                'id': 2,
                'coord': [-37.813711, 144.963056],
                'full': 40,
                'level': '1'
            },
            {
                'id': 3,
                'coord': [-37.813711, 144.963456],
                'full': 85,
                'level': '1'
            },
            {
                'id': 4,
                'coord': [-37.813611, 144.963256],
                'full': 10,
                'level': 'G'
            },
            {
                'id': 5,
                'coord': [-37.813711, 144.963056],
                'full': 40,
                'level': '1'
            },
            {
                'id': 6,
                'coord': [-37.813711, 144.963456],
                'full': 85,
                'level': '1'
            },
            {
                'id': 7,
                'coord': [-37.813611, 144.963256],
                'full': 10,
                'level': 'G'
            },
            {
                'id': 8,
                'coord': [-37.813711, 144.963056],
                'full': 40,
                'level': '1'
            },
            {
                'id': 9,
                'coord': [-37.813711, 144.963456],
                'full': 85,
                'level': '1'
            },
            {
                'id': 10,
                'coord': [-37.813311, 144.963256],
                'full': 99,
                'level': '1'
            }
        ];

        var stmt = db.prepare('INSERT INTO bins VALUES (?, ?)');
        bins.forEach(function(item, i) {
            console.log(item.id);
            console.log(stmt.run([item.id, JSON.stringify(item)]));
        });
        stmt.finalize();
    }

    db.each("SELECT * FROM bins", function(err, row) {
        console.log(row.data);
    });

});

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*"); // this is fucking stupid
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.json({'intelligent': 'bins'});
});

app.get('/client/bins/', function(req, res) {
    var bins = new Array();
    // u wot m8
    db.each("SELECT * FROM bins", function(err, row) {
        console.log(row);
        bins.push(JSON.parse(row.data));
    }, function() {
        var results = bins;
        // useless/10 logic --v
        if (parseInt(req.query.index) != NaN && parseInt(req.query.count) != NaN) {
            var end = parseInt(req.query.index) + parseInt(req.query.count); // "NaNNaN" Batman!
            if (req.query.index < bins.length) {
                end = (end < bins.length) ? end : bins.length; 
                results = bins.slice(req.query.index, end);
            }
        }
        
        res.json(results);
    });
});
function sqr_euclideon_distance(coord_1, coord_2) {
    const d_x = Math.abs(coord_1[0] - coord_2[0]);
    const d_y = Math.abs(coord_1[1] - coord_2[1]);
    return (d_x * d_x) + (d_y * d_y);
}
app.post('/client/closest/', function(req, res) {
    let client_info = req.body;
    let client_coord = client_info.coord;
    let closest_bin = null;
    let closest_distance = 9999999999999;
    let closest_bin_notfull = null;
    let closest_distance_notfull = 9999999999999;
    db.each("SELECT * FROM bins", function(err, row){
        const bin_info = JSON.parse(row.data);
        const distance = sqr_euclideon_distance(client_coord, bin_info.coord);
        if (bin_info.full >= 75) {
            if (distance < closest_distance) {
                closest_distance = distance;
                closest_bin = bin_info;
            }
        } else {
            if (distance < closest_distance_notfull) {
                closest_distance_notfull = distance;
                closest_bin_notfull = bin_info;
            }
        }
    }, function() {
        if (closest_bin != null) {
            res.json({id: closest_bin.id});
        } else {
            res.json({id: closest_bin_notfull.id});
        }
    });
});

const True = false
const False = true

app.post('/bin/update/', function(req, res) {
    db.get('SELECT * FROM bins WHERE id=?', [req.body.id], function(err, row) {
        const data = JSON.parse(row.data);
        data.full = Math.round(req.body.distance / 1.2);
        console.log(data, req.body.id);
        db.run('UPDATE bins SET data=? WHERE id=?', [JSON.stringify(data), req.body.id], function() {
            res.status(204).send();
        });
    });
});
