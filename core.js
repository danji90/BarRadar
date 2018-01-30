// Globals

Google_key = "AIzaSyDQVpoQl_Qs9sX8mElHOOvWKK5_n8HKDFw";

client_id = "UPDPWFAPNQMDYOGZK3C5RWLAWZBVCH23EDMGCXWNMXEEAKXN";

client_secret = "0JCC2M4SHSIXTYPLDSCS1A2EO2QYDFZ24RMMAFCHV2WAQRA5";

var venues;

var currentVenue

var currentLocation

// Refresh Button

$(document).on("click", "#refresh", function(e) {
    //Prevent default behaviour
    e.preventDefault();

    //1. Get Current Location
    //var geoLocURL = "https://www.googleapis.com/geolocation/v1/geolocate?key="+Google_key;

    function getPosition() {
        navigator.geolocation.getCurrentPosition(displayPosition);
    }
    
    function displayPosition(position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        var latlng = lat + "," + lng;
        return latlng
    }
    currentLocation = displayPosition()
    console.log(currentLocation)


    $.post(getPosition(currentLocation),
        function (response) {
            console.log(lat+","+lng)
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

            call_url = "https://api.foursquare.com/v2/venues/search?ll="+lat+","+lng+"&categoryId=4bf58dd8d48988d1e5931735&radius=1000&client_id="+client_id+"&client_secret="+client_secret+"&v=" + date;

            $.getJSON(call_url,
                function (data) {
                    // Process Response from FourSquare API Call
                    venues = data.response.venues;

                    //Remove previous venues
                    $('#venues_list li').remove();


                    // Sort list items by checkInsCount  or distance + add new venues to the list

                    if ($("#flip").val() == "checkins"){
                        venues.sort(function(a, b) {
                            return b.stats.checkinsCount - a.stats.checkinsCount;
                        });
                        $.each(venues, function(index,venue) {
                            $('#venues_list').append(
                                '<li><a id="to_details" href="#">'+venue.name+
                                '<span id="'+index+'" class="ui-li-count">'+venue.stats.checkinsCount+'</span>'+
                                '</a></li>');
                        });
                    }else{
                        venues.sort(function(a, b) {
                            return a.location.distance - b.location.distance;
                        });
                        $.each(venues, function(index,venue) {
                            $('#venues_list').append(
                                '<li><a id="to_details" href="#">'+venue.name+
                                '<span id="'+index+'" class="ui-li-count">'+venue.location.distance+' m</span>'+
                                '</a></li>');
                        });
                    }

                    //Refresh list content
                    $('#venues_list').listview('refresh');
                });
        })
});

$(document).on('pagebeforeshow','#home', function () {
    $(document).on('click','#to_details',function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        //Store the venue ID
        currentVenue = venues[e.target.children[0].id];
        //Change to Details Page
        $.mobile.changePage("#details")
    })
});

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
        $('#venuePopularity').text('Popularity: '+currentVenue.stats.checkinsCount +" check-in(s), " + currentVenue.stats.usersCount + " user(s), " + currentVenue.stats.tips + " tip(s)");
    }
})


$(document).on('click','#mapView', function (e) {
    e.preventDefault();
    $.mobile.changePage("#mapPage");
});


$( document ).on( "pagebeforeshow", "#mapPage", function(e) {
    e.preventDefault();

    // When refreshing the page it relocates to #home page to prevent page from getting stuck when currentVenue = undefined

    if (currentVenue == undefined){
        window.location.href = "index.html";
    } else {
        var cvLat = currentVenue.location.lat;
        var cvLon = currentVenue.location.lng;

        var LatLng = new google.maps.LatLng(cvLat, cvLon);

        drawMap(LatLng);

        function drawMap(latlng) {
            var myOptions = {
                zoom: 16,
                center: LatLng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById("map"), myOptions);

            google.maps.event.addListenerOnce(map, 'idle', function () {
                // do something only the first time the map is loaded
                var center = map.getCenter();
                google.maps.event.trigger(map, 'resize');
                map.setCenter(center);
            });

            //function to create marker
            function createMarker(coord, map) {
                //Create marker
                var marker = new google.maps.Marker({
                    position: coord,
                    map: map,
                    title: currentVenue.name
                });

                // Create a popup/info window for click on marker
                var infowindow = new google.maps.InfoWindow({
                    content: currentVenue.name
                });

                marker.addListener('click', function () {
                    infowindow.open(map, marker);
                })
                return marker
            }

            createMarker(LatLng, map);
        }
    }
})

