const express = require("express");
const axios = require("axios");
const performance = require("performance-now");

const app = express();
const { createClient } = require("redis");
const client = createClient();

//URL copied from API
const requestUrl = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Porto?unitGroup=metric&key=7V2EZMEZQ9WN2R22P3RVHDR6F&contentType=json";

app.get("/", async (req, res) => {
  //Creating route (localhost:3000/)
  const startTime = performance(); //Starting timer to measure the fetching time

  //First, we try to get weather information from cache
  const weatherFromCache = await client.get("weather");
  if (weatherFromCache) {
    //Once this information exists in the cache...
    res.send(weatherFromCache); //It is send as response
    const endTime = performance(); //Recornding the end fetching time
    const loadTime = endTime - startTime; //Calculating the time spent
    console.log(`Fetching time: [Redis] ${loadTime.toFixed(2)} ms`);//Displaying this information in the console log
    return; //Preventing further code execution
  }

  //Once the weather information does not exists in the cache...
  try {
    const response = await axios.get(requestUrl); //Fetching from Weather API
    const weatherData = response.data;//Getting data from response
    await client.set("weather", JSON.stringify(weatherData), { EX: 5 });//Creating a register on Redis and defining the expiration time to 5 seconds

    const endTime = performance();//Recornding the end fetching time
    const loadTime = endTime - startTime;//Calculating the time spent
    console.log(`Fetching time: [__API] ${loadTime.toFixed(2)} ms`);//Displaying this information in the console log

    res.send(weatherData);//It is send as response
  } catch (error) {
    console.error(
      "An error occurred while getting the data from the API:",
      error
    );
    res
      .status(500)
      .send("An error occurred while getting the data from the API");
  }
});

//Function responsible for starting the server and connecting Redis client
const startup = async () => {
  await client.connect();//Connecting Redis Client
  app.listen(3000, () => {//Starting the server
    console.log("Server is running on port 3000!");
  });
};

startup(); //Starting this mandatory function