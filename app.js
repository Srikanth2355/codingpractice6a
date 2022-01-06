const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const states = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

//get states
app.get("/states/", async (req, res) => {
  const query = `
        SELECT * FROM state;
    `;
  const responsedb = await db.all(query);
  res.send(responsedb.map((obj) => states(obj)));
});

//get particular state
app.get("/states/:stateId", async (req, res) => {
  const { stateId } = req.params;
  const query = `
    SELECT * FROM state 
    WHERE state_id = ${stateId};
    `;
  const responsedb = await db.get(query);
  res.send(states(responsedb));
});

//{
//   "districtName": "Bagalkot",
//   "stateId": 3,
//   "cases": 2323,
//   "cured": 2000,
//   "active": 315,
//   "deaths": 8
// }
//add district
app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, curved, active, deaths } = req.body;
  const query = `
        INSERT INTO district (
            district_name,
            state_id,
            cases,
            curved,
            active,
            deaths
        )
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${curved},
            ${active},
            ${deaths}
        ); `;
  const responsedb = await db.run(query);
  res.send("District Successfully Added");
});

const districts = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    curved: obj.curved,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//get particular district
app.get("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const query = `
        SELECT * FROM district 
        WHERE district_id = ${districtId};
    `;
  const responsedb = await db.get(query);
  res.send(districts(responsedb));
});

//delete district
app.delete("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const query = `
    DELETE FROM district 
    WHERE district_id = ${districtId};
    `;
  const responsedb = await db.run(query);
  res.send("District Removed");
});

/*{
  "districtName": "Nadia",
  "stateId": 3,
  "cases": 9628,
  "cured": 6524,
  "active": 3000,
  "deaths": 104
} */
//Add district
app.put("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const { districtName, stateId, cases, curved, active, deaths } = req.body;
  const query = `
        UPDATE district
        SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        curved = ${curved},
        active = ${active},
        deaths = ${deaths}
        WHERE 
        district_id = ${districtId};
    `;
  const responsedb = await db.run(query);
  res.send("District Details Up");
});
const statistics = (obj) => {
  return {
    totalCases: obj.totalcases,
    totalCurved: obj.totalcurved,
    totalActive: obj.totalactive,
    totalDeaths: obj.totaldeaths,
  };
};

//get total sums
app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const query = `
        SELECT SUM(cases) AS totalcases,
        SUM(curved) AS totalcurved,
        SUM(active) AS totalactive,
        SUM(DEATHS) AS totaldeaths
        FROM state LEFT JOIN district ON state.state_id = district.state_id
        WHERE state.state_id = ${stateId};
    `;
  const responsedb = await db.run(query);
  res.send(statistics(responsedb));
});
const state = (name) => {
  return {
    stateName: name.state_name,
  };
};

//get statename using district id
app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const query = `
        SELECT state_name FROM district
    NATURAL JOIN
      state
        WHERE district_id = ${districtId};
    `;
  const responsedb = await db.get(query);
  //   res.send(responsedb);
  res.send({ stateName: responsedb.state_name });
});

module.exports = app;
