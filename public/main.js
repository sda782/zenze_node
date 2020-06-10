var map = L.map('map', { zoomControl: false }).fitWorld();

var currentlocation = {
    "lat": 0,
    "long": 0
};
var selectedpos;
var cmd;

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: '',
    maxZoom: 18,
    id: 'mapbox/light-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYWV2dW0iLCJhIjoiY2thanI0c2FlMDkxaDJ0bHM4Z2pwNGllcyJ9.Od2H02EIte0aVMCRR5IuvQ'
}).addTo(map);

map.locate({ setView: true, maxZoom: 18 });
$('.leaflet-control-attribution').toggle();

//get marker location and images : https://raw.githubusercontent.com/sda782/zenze/master/imageindex.json
$.getJSON('http://cors-anywhere.herokuapp.com/https://drive.google.com/uc?id=1AYch2-Yf0OxRrL0SfCXhKLs9AXp7XZoR', (Iindex) => {
    Object.keys(Iindex).forEach(function(k) {
        var item = Iindex[k];
        var marker = L.marker([item.coord.latitude, item.coord.longtitude], { icon: UI_locationmarker }).addTo(map);
        var photoImg = '<img src="' + item.imageurl + '" height="150px" width="150px"/>';
        marker.bindPopup(photoImg + "<br><h3>" + item.title + "</h3><p>" + item.author + "</p>").on('click', () => {
            map.setView([item.coord.latitude, item.coord.longtitude], 14);
        });
    });
});

var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();

var searchControl = L.esri.Geocoding.geosearch({
    providers: [
        arcgisOnline,
        L.esri.Geocoding.mapServiceProvider({
            label: 'States and Counties',
            url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
            layers: [2, 3],
            searchFields: ['NAME', 'STATE_NAME']
        })
    ]
}).addTo(map);

/*L.esri.Geocoding.geosearch().addTo(map);*/

var results = L.layerGroup().addTo(map);

searchControl.on('results', function(data) {
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
        results.addLayer(L.marker(data.results[i].latlng));
    }
});

//create marker at clicked location
map.on('click', selectpos);

//finds you
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

//functions
function onLocationFound(e) {
    L.marker(e.latlng, { icon: UI_currentlocation }).addTo(map);
    currentlocation.lat = e.latlng.lat;
    currentlocation.long = e.latlng.lng;
}

function onLocationError(e) {
    alert(e.message);
}

//Set view to selected marker
function curpos() {
    map.setView([currentlocation.lat, currentlocation.long], 16);
}

//create maker on click with location
function selectpos(e) {
    if (selectedpos != undefined) {
        map.removeLayer(selectedpos);
    };
    selectedpos = L.marker(e.latlng).addTo(map);
    selectedpos.bindPopup("<form ref='uploadForm' id='uploadForm' action='/upload' method='post' encType='multipart/form-data' onsubmit='playloading()'><input type='hidden' name='mlat' value='" + e.latlng.lat + "'/><input type='hidden' name='mlng' value='" + e.latlng.lng + "'/><input type='file' name='sampleFile' id='uploadfile' onchange='readURL(this);'/><div id='loading_div'><div></div><div></div></div><label id='uploadlabel' for='uploadfile'><img id='previewimg' src='UI/locationmarker.png' width='150px' height='150px'></label><input type='text' name='title' value='title' id='input_title'/><input type='text' name='author' value='name' id='input_title'/><br><input id='submit_button' type='submit' value='Add' /></form>").openPopup();
}

function copytoclipboard() {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = cmd;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
            document.getElementById('previewimg').src = e.target.result;
            //$('#previewimg').attr('src', e.target.result);
        }

        reader.readAsDataURL(input.files[0]); // convert to base64 string
    }
}
