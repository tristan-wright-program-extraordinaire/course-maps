import React, { useState, useEffect,useCallback,useRef } from 'react';
import { AdvancedMarker, Pin, InfoWindow,useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

function PoiMarker({ poi,styles,setActiveCourse,activeCourse }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  const gradientObj = {
    "Yardage Card": "#F79F79",
    "Course Guide": "#E3F09B",
    "Score Card": "#87B6A7",
    "Kiosk": "#F7D08A",
    "Pin Sheet": "#5B5941"
  }

  const products = Array.isArray(poi.products)
    ? poi.products.map(s => String(s || '').trim()).filter(Boolean)
    : [];
  const activeStyles = Object.assign({},...(products.map(product => styles[product.toLowerCase().replace(" ","-")])),...(poi.course_info.tags.includes("PUSH") ? [styles['push-list']] : [{}]))

  const handleOpen = (e) => {
    setActiveCourse(poi.course_info)
  }

  const handleClose = useCallback(() => setInfoWindowShown(false), []);

  return (
    <AdvancedMarker
    key={poi.key}
    ref={markerRef}
    position={poi.location}
    title={poi.key}
    onClick={handleOpen}
    >
        <div className="pinMarker" style={activeStyles}>
            <svg width="32" height="32" viewBox="0 0 26 37" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* <defs>
                    <linearGradient
                    id={gradId}
                    x1="0%" y1="0%" x2="0%" y2="100%"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform={`rotate(25 13 18.5)`} // rotate around center
                    >
                    {products.length === 0 ? (
                        <stop key="single" offset="0%" stopColor="#fb5f04" />
                    ) : products.flatMap((product, i) => {
                        const color = gradientObj[product] || '#cccccc';
                        const start = (i * (colorSize + whiteSize));
                        const end = start + colorSize;
                        const whiteStart = end;
                        const whiteEnd = end + whiteSize;
                        return [
                        <stop key={`${i}-a`} offset={`${start}%`} stopColor={color} />,
                        <stop key={`${i}-b`} offset={`${end}%`} stopColor={color} />,
                        <stop key={`${i}-c`} offset={`${whiteStart}%`} stopColor="white" />,
                        <stop key={`${i}-d`} offset={`${whiteEnd}%`} stopColor="white" />
                        ];
                    })}
                    </linearGradient>
                </defs> */}
                <path d="M13 0C5.8175 0 0 5.77328 0 12.9181C0 20.5733 5.59 23.444 9.55499 30.0784C12.09 34.3207 11.3425 37 13 37C14.7225 37 13.975 34.2569 16.445 30.1422C20.085 23.8586 26 20.6052 26 12.9181C26 5.77328 20.1825 0 13 0Z"/>
                <path fill={activeCourse === poi.course_info ? `#5A6FD9` : (poi.course_info.tags.includes("PUSH") ? (poi.course_info.super_push === "False" ? `#79d935` : `#c6f51d`) : `#ff8e50`)} d="M13.0167 35C12.7836 35 12.7171 34.9346 12.3176 33.725C11.9848 32.6789 11.4854 31.0769 10.1873 29.1154C8.92233 27.1866 7.59085 25.6173 6.32594 24.1135C3.36339 20.5174 1 17.7057 1 12.6385C1.03329 6.19808 6.39251 1 13.0167 1C19.6408 1 25 6.23078 25 12.6385C25 17.7057 22.6699 20.55 19.6741 24.1462C18.4425 25.65 17.1443 27.2193 15.8793 29.1154C14.6144 31.0442 14.0818 32.6135 13.749 33.6596C13.3495 34.9346 13.2497 35 13.0167 35Z"/>
                <path fill='black' d="M13 18C15.7614 18 18 15.7614 18 13C18 10.2386 15.7614 8 13 8C10.2386 8 8 10.2386 8 13C8 15.7614 10.2386 18 13 18Z"/>
            </svg>
            {/* <Pin background={'#f5ac3c'} glyphColor={'#000'} borderColor={'#000'} /> */}
        </div>
    </AdvancedMarker>
  );
}

export default PoiMarker;
