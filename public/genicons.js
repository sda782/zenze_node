//  Creates icons
var UI_currentlocation = L.icon({
    iconUrl: 'UI/currentlocation.png',
    iconSize: [16, 16], // size of the icon
    iconAnchor: [8, 8], // point of the icon which will correspond to marker's location
});

var UI_locationmarker = L.icon({
    iconUrl: 'UI/locationmarker.png',
    iconSize: [48, 48], // size of the icon
    iconAnchor: [24, 24], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -24] // point from which the popup should open relative to the iconAnchor
});