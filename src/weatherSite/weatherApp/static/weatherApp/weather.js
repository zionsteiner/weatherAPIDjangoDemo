var formParamsString = function() {
    // Converts passed args to array
    let argsArray = Array.from(arguments);
    // Pops first argument off array
    let url = argsArray.shift();
    // Returns base url + ? + args joined with &
    return `${url}?${argsArray.join('&')}`;
}

var formatDate = function(date) {
    var months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];

    var month = months[date.getMonth()];
    var day = date.getDay();
    var year = date.getFullYear();
    return month + " " + day + ", " + year;
}

var formatTime = function(date) {
    var hour = date.getHours();
    var min = date.getMinutes();
    var AmPm = "AM";

    if (hour > 12) {
        hour %= 12;
        AmPm = "PM";
    }

    if (min < 10) {
        min = "0" + min;
    }

    return hour + ":" + min + " " + AmPm;
}

var nextKey = function(key, obj) {
    var keys = Object.keys(obj);

    return keys[(keys.indexOf(key) + 1) % keys.length];
}


var weatherApp = new Vue({
        // Changed Vue delimiters to clash with Django's
        delimiters: [ '[%', '%]' ],

        el: '#weatherApp',

        data: {
            geoData: false,
            currWeatherData: false,
            forecastData: false,
            votes: {"likely": 0,
                    "unlikely": 0,
                    "default": 0
                    },
        },

        methods: {
            date(index) {
                var date = new Date(0);
                if (index) {
                    date.setUTCSeconds(this.forecastData[index].dt);
                 } else {
                    date.setUTCSeconds(this.currWeatherData.dt);
                }
                return formatDate(date);
            },

            time(index) {
                var date = new Date(0);
                if (index) {
                    date.setUTCSeconds(this.forecastData[index].dt);
                } else {
                    date.setUTCSeconds(this.currWeatherData.dt);
                }
                return formatTime(date);
            },

            temp(index) {
                var temp;
                if (index) {
                    temp = this.forecastData[index].main.temp;
                } else {
                    temp = this.currWeatherData.main.temp;
                }
                return temp + " F";
            },

            conditions(index) {
                var conditions;
                if (index) {
                    conditions = this.forecastData[index].weather[0].description;
                } else {
                    conditions = this.currWeatherData.weather[0].description;
                }
                var conditionsStr = conditions.charAt(0).toUpperCase() + conditions.slice(1);
                return conditionsStr;
            },

            humidity(index) {
                var humidity;
                if (index) {
                    humidity = this.forecastData[index].main.humidity;
                } else {
                    humidity = this.currWeatherData.main.humidity;
                }
                return humidity + "%";
            },

            pressure(index) {
                var pressure;
                if (index) {
                    pressure = this.forecastData[index].main.pressure;
                } else {
                    pressure = this.currWeatherData.main.pressure;
                }
                return pressure + " hPa";
            },

            vote: function(event) {
                // Change vote
                var index = event.currentTarget.getAttribute('data-idx');
                var key = this.forecastData[index].vote;
                this.forecastData[index].vote = nextKey(key, this.votes);

                // Update vote counts
                this.votes[key]--;
                this.votes[this.forecastData[index].vote]++;
            }
        },

        computed: {
        },

        created: function() {
            // IPStack API request url info
            var baseIPStackUrl = "http://api.ipstack.com/check";
            var accessKeyIPStack = "ae6b1fefada773fd34becf1361ddfbe3";
            var ipStackRequestUrl = formParamsString(baseIPStackUrl, `access_key=${accessKeyIPStack}`);

            // OpenWeatherMap API request url info
            var baseOWMUrl = "https://api.openweathermap.org/data/2.5/";
            var accessKeyOWM = "a6eb82bede2bc3920fb4b1052e7985aa";
            var units = "imperial";

            fetch(ipStackRequestUrl)
                .then(data => data.json())
                .then(json => {
                    this.geoData = json;
                    var lat = this.geoData.latitude;
                    console.log(lat);
                    var lon = this.geoData.longitude;
                    console.log(lon);

                    var currWeatherRequest = formParamsString(baseOWMUrl + 'weather', `lat=${lat}`, `lon=${lon}`, `units=${units}`, `APPID=${accessKeyOWM}`);
                    return fetch(currWeatherRequest);
                })
                .then(data => data.json())
                .then(json => {
                    this.currWeatherData = json;
                    console.log(this.currWeatherData);
                    var lat = this.geoData.latitude;
                    var lon = this.geoData.longitude;

                    var forecastRequest = formParamsString(baseOWMUrl + 'forecast', `lat=${lat}`, `lon=${lon}`, `units=${units}`, `APPID=${accessKeyOWM}`);
                    return fetch(forecastRequest);
                    })
                .then(data => data.json())
                .then(json => {
                    this.forecastData = [];
                    for (let i = 0; i < json.list.length; i++) {
                        if (i != 0 && i % 7 == 0) {
                            this.forecastData.push(json.list[i]);
                        }
                    }
                    for (var forecast in this.forecastData) {
                        this.forecastData[forecast].vote = "default";
                        this.votes[this.forecastData[forecast].vote]++;
                    }
                    console.log(this.forecastData);
                });
        },
    });
