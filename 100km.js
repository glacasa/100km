
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

function display100km(point) {
    clearMap();
    let marker = L.marker([point.latitude, point.longitude]).addTo(map);
    layers.push(marker);
    let circle = L.circle([point.latitude, point.longitude], 100000).addTo(map);
    layers.push(circle);
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
    var searchButton = document.getElementById("search");
    var adressComplete = new Awesomplete(addressInput, { list: [] });
    addressInput.addEventListener("awesomplete-select", function (evt) {
        var coordinates = evt.text.value;
        evt.text.value = evt.text.label;

        var point = { latitude: coordinates[1], longitude: coordinates[0], nom: evt.text.label };
        display100km(point);
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

            adressComplete.list = addresses;
        });
    }

    function onSearch() {
        var search = addressInput.value;
        searchAddress(search, function (result) {
            if (result && result.features && result.features.length) {
                var coordinates = result.features[0].geometry.coordinates;
                var point = { latitude: coordinates[1], longitude: coordinates[0], nom: search };
                display100km(point);
            }
        });
    }

    addressInput.oninput = delay(onAddressChange, 200);
    addressInput.onkeypress = function (e) {
        if (e.keyCode == 13) {
            // Touche Entrée, on lance la recherche
            abortPendingXhr();
            onSearch();
        }
    };
    searchButton.onclick = function () {
        abortPendingXhr();
        onSearch();
    }
}

// Initialisation

initMap();
initAutocomplete();