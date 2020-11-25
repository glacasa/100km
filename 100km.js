
// Carte
var map;
var layers = [];
var tileUrl = "https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";

function initMap() {
    map = L.map('map');
    setView({ lat: 46.9, lon: 1.8 }, 6);

    L.tileLayer(tileUrl, {
        attribution: 'Carte &copy; <a href="https://www.openstreetmap.org/">Contributeurs de OpenStreetMap</a>, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | Adresses &copy; <a href="https://adresse.data.gouv.fr/donnees-nationales">IGN, Etalab</a>, <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence">Licence Ouverte</a>',
        maxZoom: 18,
        tileSize: 512,
        zoomOffset: -1,
    }).addTo(map);
}

function setView(point, zoom) {
    map.setView([point.lat, point.lon], zoom);
}

function displayNkm(point) {
    clearMap();
    let marker = L.marker([point.latitude, point.longitude]).addTo(map);
    layers.push(marker);
    let dist = document.getElementById("distance").value;
    let circle = L.circle([point.latitude, point.longitude], dist*1000).addTo(map);
    layers.push(circle);
    map.fitBounds(circle.getBounds());
}

function displayNkm(point1, point2) {
    clearMap();
    let marker = L.marker([point1.latitude, point1.longitude]).addTo(map);
    layers.push(marker);
    let dist = document.getElementById("distance").value;
    let circle = L.circle([point1.latitude, point1.longitude], dist*1000).addTo(map);
    layers.push(circle);

    let marker2 = L.marker([point2.latitude, point2.longitude]).addTo(map);
    layers.push(marker2);
    let circle2 = L.circle([point2.latitude, point2.longitude], dist*1000).addTo(map);
    layers.push(circle2);
    map.fitBounds(circle.getBounds());
}

function clearMap() {
    for (let i = 0; i < layers.length; i++) {
        map.removeLayer(layers[i]);
    }
    layers.length = 0;
}

// Adresses

var timer = 0;
var xhr = null;

function searchAddress(address, success) {
    let url = "https://api-adresse.data.gouv.fr/search/?q=" + encodeURIComponent(address);
    xhr = $.ajax({
        url: url,
        success: function (result) {
            xhr = null;
            success(result);
        }
    });
}

function abortPendingXhr() {
    clearTimeout(timer);
    if (xhr) xhr.abort();
}

function delay(callback, ms) {
    return function () {
        var context = this, args = arguments;
        abortPendingXhr();
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

function initAutocomplete() {
    var addressInput = document.getElementById("address");
    var address2Input = document.getElementById("address2");
    var searchButton = document.getElementById("search");
    var addressComplete = new Awesomplete(addressInput, { list: [] });
    var addressComplete2 = new Awesomplete(address2Input, { list: [] });
    addressInput.addEventListener("awesomplete-select", function (evt) {
        var coordinates = evt.text.value;
        evt.text.value = evt.text.label;

        var point = { latitude: coordinates[1], longitude: coordinates[0], nom: evt.text.label };
        displayNkm(point);
    });
    
    address2Input.addEventListener("awesomplete-select", function (evt) {
        var coordinates = evt.text.value;
        evt.text.value = evt.text.label;

        var point = { latitude: coordinates[1], longitude: coordinates[0], nom: evt.text.label };
        displayNkm(point);
    });



    function onAddressChange() {
        var search = addressInput.value;
        if (!search) {
            document.getElementById("addressAutocomplete").innerHTML = "";
            return;
        }

        searchAddress(search, function (result) {
            var addresses = [];
            if (result && result.features && result.features.length) {
                for (var i = 0; i < result.features.length; i++) {
                    var feature = result.features[i];
                    addresses.push({
                        label: feature.properties.label,
                        value: feature.geometry.coordinates,
                    });
                }
            }

            addressComplete.list = addresses;
        });
    }
    
    function onAddress2Change() {
        var search = address2Input.value;
        if (!search) {
            document.getElementById("addressAutocomplete").innerHTML = "";
            return;
        }

        searchAddress(search, function (result) {
            var addresses = [];
            if (result && result.features && result.features.length) {
                for (var i = 0; i < result.features.length; i++) {
                    var feature = result.features[i];
                    addresses.push({
                        label: feature.properties.label,
                        value: feature.geometry.coordinates,
                    });
                }
            }

            addressComplete2.list = addresses;
        });
    }

    function onSearch() {
        var search = addressInput.value;
        var search2 = address2Input.value;
        searchAddress(search, function (result) {
            if (result && result.features && result.features.length) {
                var coordinates = result.features[0].geometry.coordinates;
                var point = { latitude: coordinates[1], longitude: coordinates[0], nom: search };
                if( search2 )
                {
                    searchAddress(search2, function (result2) {
                        var coordinates = result2.features[0].geometry.coordinates;
                        var point2 = { latitude: coordinates[1], longitude: coordinates[0], nom: search };
                        displayNkm(point, point2);
                    });
                }
                else
                {
                    displayNkm(point);
                }
            }
        });
    }

    addressInput.oninput = delay(onAddressChange, 200);
    addressInput.onkeypress = function (e) {
        if (e.keyCode == 13) {
            // Touche Entr�e, on lance la recherche
            abortPendingXhr();
            onSearch();
        }
    };

    address2Input.oninput = delay(onAddress2Change, 200);
    address2Input.onkeypress = function (e) {
        if (e.keyCode == 13) {
            // Touche Entr�e, on lance la recherche
            abortPendingXhr();
            onSearch();
        }
    };
    searchButton.onclick = function () {
        abortPendingXhr();
        onSearch();
    };
}

// Initialisation

initMap();
initAutocomplete();