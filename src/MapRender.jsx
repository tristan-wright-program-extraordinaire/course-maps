import React, { useState, useEffect, useCallback } from 'react';
import { AdvancedMarker, Map, useMap  } from '@vis.gl/react-google-maps';
import PoiMarker from './PoiMarker'
import { Circle } from './components/circle'
import { Polyline } from './components/polyline'

function MapPanHandler({ flyTo,zoomLevel }) {
    const map = useMap();
    useEffect(() => {
        if (!flyTo || !map) return;
        try {
            if (typeof map.panTo === 'function') map.panTo(flyTo.location);
            else if (typeof map.setCenter === 'function') map.setCenter(flyTo.location);
            if (flyTo.zoom && typeof map.setZoom === 'function') map.setZoom(flyTo.zoom)
            else if (flyTo.places && zoomLevel < 8) {
                map.setZoom(9)
            }
        } catch (err) {
            console.error('Map pan failed', err);
        }
    }, [flyTo, map])
    return null;
}

function MeasurementHandler({ measureToggle,measurementPoints,setMeasurementPoints,activeCourse }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !measureToggle) return;

        const handleClick = (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            console.log(measurementPoints)

            setMeasurementPoints(prev => {
                // If we have 2 points and active course, start new measurement from active course
                console.log(activeCourse)
                if (prev.length >= 2 && activeCourse) {
                    console.log(1)
                    return [activeCourse.location, { lat, lng }];
                }
                // If we have 2 points without active course, start fresh
                if (prev.length >= 2) {
                    console.log(2)
                    return [{ lat,lng }]
                };
                // If we have 1 point and active course, replace first point with active course
                if (prev.length === 1 && activeCourse) {
                    console.log(3)
                    return [activeCourse.location, { lat, lng }];
                }
                console.log(4)
                // Otherwise just add the point
                return [...prev, { lat, lng }];
            })
        }

        const listener = map.addListener('click', handleClick)
        return () => listener.remove()
    }, [map, measureToggle, setMeasurementPoints, measurementPoints.length, activeCourse])
}



function MapRender({ displayCourses,styles,flyTo,setActiveCourse,activeCourse,radiusToggle,areaRadius,measureToggle,measurementPoints,setMeasurementPoints,placeSelection }) {
    const [zoomLevel, setZoomLevel] = useState(5)
    const [placesPin, setPlacesPin] = useState(null)

    const handleCameraChange = useCallback((ev= MapCameraChangedEvent) => {
        setZoomLevel(ev.detail.zoom)
    });

    useEffect(() => {
        if (measureToggle && activeCourse && (measurementPoints.length === 0 || measurementPoints.length === 2)) {
            setMeasurementPoints([{
                lat: activeCourse.location.lat,
                lng: activeCourse.location.lng
            }])
        }
        if (!activeCourse) {
            setMeasurementPoints([])
        }
    }, [measureToggle, activeCourse])

    useEffect(() => {
        if (!flyTo) return
        if (flyTo.places) {
            console.log("SETTING PLACES PIN")
            setPlacesPin(flyTo.location)
        }
    }, [flyTo])
    
    return (
        <Map
        style={{width: '100%', height: '100%'}}
        defaultCenter={{lat: 40.7946, lng: -97.5348}}
        defaultZoom={5}
        disableDefaultUI={true}
        mapId="*****PROPRIETARY INFO *****"
        controlled={false}
        onZoomChanged={handleCameraChange}
        gestureHandling={"greedy"}
        >
            {activeCourse && radiusToggle ? <Circle center={activeCourse.location} radius={1609.34 * areaRadius}/> : null}

            {flyTo ? <MapPanHandler flyTo={flyTo} zoomLevel={zoomLevel}/> : null}

            {measureToggle ?
                <MeasurementHandler measureToggle={measureToggle} measurementPoints={measurementPoints} setMeasurementPoints={setMeasurementPoints} activeCourse={activeCourse}/>
            : null}

            {/* Draw measurement markers and line */}
            {measurementPoints.length > 0 ? <>
                {measurementPoints.map(point => (
                    <Circle center={point} radius={800 / zoomLevel}/>
                ))}
                <Polyline
                    path={measurementPoints}
                />
            </> : null}
            
            {placesPin ? <AdvancedMarker
                key={placeSelection.placePrediction.placeId}
                position={placesPin}
                title={placeSelection.placePrediction.text.text}
                >
                    <svg width="48" height="48" viewBox="0 -10 160 352.05" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill='#d1d3d4' stroke="black" stroke-width="10" d="M58.71,158.14l20.1,181.97c.19,2.59,4,2.58,4.18-.01l17-181.61-41.28-.35Z"/>
                        <circle fill='#ad1015' stroke="black" stroke-width="10" cx="80" cy="81.01" r="80"/>
                        <ellipse fill='#ed1c24' cx="72.88" cy="69.68" rx="64.88" ry="60.68"/>
                        <ellipse fill='#f2665b' cx="42.55" cy="46.54" rx="28.82" ry="21.47" transform="translate(-20.3 41.35) rotate(-42.84)"/>
                    </svg>
            </AdvancedMarker> : null}

            {displayCourses.length > 0 ? displayCourses.map(course => (
                <PoiMarker
                    key={course.course_id}
                    poi={{"key": course.name,"location": course.location,"course_info": course, "products":course.products ? course.products.split(";").map(s => s.trim()) : null}}
                    styles={styles} setActiveCourse={setActiveCourse} activeCourse={activeCourse}/>
            )) : null}
        </Map>
    );
}

export default MapRender;
