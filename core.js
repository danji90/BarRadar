// Globals

var Google_key = "AIzaSyDHWaUDzznLDy5iZd_wJiySK5ylyIoTU5A";

var client_id = "UPDPWFAPNQMDYOGZK3C5RWLAWZBVCH23EDMGCXWNMXEEAKXN";

var client_secret = "0JCC2M4SHSIXTYPLDSCS1A2EO2QYDFZ24RMMAFCHV2WAQRA5";

var marker

$(document).ready(function(){

  $("[data-role=header]").fixedtoolbar({})
  $("[data-role=footer]").fixedtoolbar({})

  function compileMap() {

    var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery � <a href="http://mapbox.com">Mapbox</a>'

    // Define basemap source URL
    var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibmdhdmlzaCIsImEiOiJjaXFheHJmc2YwMDdoaHNrcWM4Yjhsa2twIn0.8i1Xxwd1XifUU98dGE9nsQ';

    var basemap = L.tileLayer(mbUrl, {
      id: 'mapbox.streets',
      maxZoom: 19,
      attribution: mbAttr
    });

    var map = L.map('map', {
      layers: [basemap]
    })

    map.setView([20, 30], 4)

    setTimeout(function(){
        map.invalidateSize()
    },300);

    return map
  }

  var map = compileMap()

  $(document).on("click", "#mapSwitch", function() {
    setTimeout(function(){
        map.invalidateSize()
    },300);
  })


  function getCurrentPosition() {
      navigator.geolocation.getCurrentPosition(function(position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log(pos)
          map.setView([pos.lat, pos.lng], 10)

        }, function(){
          // If user rejects device geolocation it will use google API
          var geoLocURL = "https://www.googleapis.com/geolocation/v1/geolocate?key=" + Google_key;
          $.post(geoLocURL,
            function(response) {
              var pos = {
                lat: response.location.lat,
                lng: response.location.lng
              }
              console.log(pos)
              map.setView([pos.lat, pos.lng], 10)
              // createWeatherMap(pos.lat, pos.lng)
            });
        })
    }

  getCurrentPosition()

  $(document).on("click", "#refresh", function(e) {
      //Prevent default behaviour
      e.preventDefault();
      //1. Get Current Location
      var geoLocURL = "https://www.googleapis.com/geolocation/v1/geolocate?key="+Google_key;

      $.post(geoLocURL,
          function (response) {
              // Convert date to yyyyMMdd for URL
              var d = new Date();
              function convertDate(date) {
                  var yyyy = date.getFullYear().toString();
                  var mm = (date.getMonth()+1).toString();
                  var dd  = date.getDate().toString();
                  var mmChars = mm.split('');
                  var ddChars = dd.split('');
                  return yyyy + (mmChars[1]?mm:"0"+mmChars[0]) + (ddChars[1]?dd:"0"+ddChars[0]);
              }

              var date = convertDate(d);

              var lat = response.location.lat;
              var lng = response.location.lng;

              call_url = "https://api.foursquare.com/v2/venues/search?ll="+lat+","+lng+"&categoryId=4d4b7105d754a06376d81259&radius=1000&client_id="+client_id+"&client_secret="+client_secret+"&v=" + date;
              console.log(call_url)
              $.getJSON(call_url,
                  function (data) {
                      // Process Response from FourSquare API Call
                      venues = data.response.venues;
                      console.log(venues)
                      //Remove previous venues
                      $('#venues_list li').remove();
                      venues.sort(function(a, b) {
                              return a.location.distance - b.location.distance;
                          });
                          $.each(venues, function(index,venue) {
                              $('#venues_list').append(
                                  '<li><a id="to_details" href="#">'+venue.name+
                                  '<span id="'+index+'" class="ui-li-count">'+venue.location.distance+' m</span>'+
                                  '</a></li>');
                          });

                      //Refresh list content
                      $('#venues_list').listview('refresh');
                  });
          })
        });

        $(document).on('click','#to_details',function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            console.log(marker)

            if (marker != undefined){
              map.removeLayer(marker);
            }

            //Store the venue object
            currentVenue = venues[e.target.children[0].id];

            var LatLng ={
              lat:currentVenue.location.lat,
              lon:currentVenue.location.lng
            }

            marker = L.marker(L.latLng(LatLng.lat, LatLng.lon))
                  .bindPopup(currentVenue.name);
            marker.addTo(map);

            map.setView([LatLng.lat, LatLng.lon], 16)

            //Change to Details Page
            $.mobile.changePage("#details")
        })

      //Update Details Page
      $(document).on('pagebeforeshow','#details', function (e) {
          e.preventDefault();

          // When refreshing the page it relocates to #home page to prevent page from getting stuck when currentVenue = undefined

          if (currentVenue == undefined){
              window.location.href = "index.html";
          } else {
              $('#venueName').text(currentVenue.name);
              $('#venueCity').text('City: '+currentVenue.location.city);
              $('#venueState').text('State: '+currentVenue.location.state);
              $('#venueCountry').text('Country: '+currentVenue.location.country);
              $('#venueDistance').text('Distance from user: '+currentVenue.location.distance);
              // $('#venuePopularity').text('Popularity: '+currentVenue.stats.checkinsCount +" check-in(s), " + currentVenue.stats.usersCount + " user(s), " + currentVenue.stats.tips + " tip(s)");
          }
      })

      $(document).on("click", "#mapView", function() {
        setTimeout(function(){
            map.invalidateSize()
        },300);
      })



})
