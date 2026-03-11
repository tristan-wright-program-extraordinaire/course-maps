import React, { useState, useEffect, useRef } from 'react';
import './App.css'
import MapRender from './MapRender'
import { APIProvider, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import axios from "axios";

export function Place_Data({ searchTerm,setPlaceSuggestions,setFlyTo,placeSelection }) {
  const placesLibrary = useMapsLibrary('places');
  const [placesService, setPlacesService] = useState(null);
  const debounceTimer = useRef(null); // Add debounce timer ref

  useEffect(() => {
    if (!placesLibrary) return;
    
    // Initialize the new places service
    setPlacesService({
      AutocompleteSuggestion: placesLibrary.AutocompleteSuggestion,
      Geocoder: new window.google.maps.Geocoder()
    });
  }, [placesLibrary]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchTerm.length === 0) {
      setPlaceSuggestions([]);
      return;
    }

    // Set new timer - wait 500ms after user stops typing
    debounceTimer.current = setTimeout(() => {
      updateSuggestions(searchTerm);
    }, 500);

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (placeSelection) {
      placesService.Geocoder.geocode(
        { placeId: placeSelection.placePrediction.placeId }, 
        (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            setFlyTo({
              location: {
                lat: location.lat(),
                lng: location.lng(),
              },
              places: true
            });
          }
        }
      );
    }
  }, [placeSelection])

  const updateSuggestions = async (q) => {
    const ql = String(q || '').trim().toLowerCase();
    console.log(ql)
    if (!ql) {
      setPlaceSuggestions([]);
      return;
    }

    console.log(placesService)

    // Place predictions using new API
    if (placesService?.AutocompleteSuggestion) {
      try {
        const request = {
          input: q,
          includedPrimaryTypes: ['locality','postal_code'],
          includedRegionCodes: ['us', 'ca'],
        };
        
        console.log(request)

        const { suggestions } = await placesService.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        console.log(suggestions)
        
        if (suggestions && suggestions.length > 0) {
          setPlaceSuggestions(suggestions.slice(0, 5));
        } else {
          setPlaceSuggestions([]);
        }
      } catch (error) {
        console.error('Places API error:', error);
        setPlaceSuggestions([]);
      }
    }
  };

  const testSearch = () => {
    updateSuggestions("Arizona")
  }
  return (<></>)
}

export default function App() {
  const [displayCourses,setDisplayCourses] = useState([])

  // filter checkbox state (keys are normalized)
  const [filters, setFilters] = useState({
    "yardage-card": true,
    "course-guide": true,
    "score-card": true,
    "kiosk": true,
    "pin-sheet": true,
    "push-list": true
  });
  const [styles, setStyles] = useState({
    "yardage-card": {
      display: "block",
    },
    "course-guide": {
      display: "block",
    },
    "score-card": {
      display: "block"
    },
    "kiosk": {
      display: "block"
    },
    "pin-sheet": {
      display: "block"
    },
    "push-list": {
      display: "block"
    }
  })
  const [searchQuery, setSearchQuery] = useState('');
  const [flyTo, setFlyTo] = useState(null);
  const [activeCourse,setActiveCourse] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [radiusToggle, setRadiusToggle] = useState(false);
  const [areaRadius, setAreaRadius] = useState(50);
  const [measureToggle, setMeasureToggle] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);

  const [productCounts, setProductCounts] = useState({
    "yardage-card": 0,
    "course-guide": 0,
    "score-card": 0,
    "kiosk": 0,
    "pin-sheet": 0,
    "push-list": 0
  })

  // autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm,setSearchTerm] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggRef = useRef(null);
  const inputRef = useRef(null);

  // autocomplete place suggestions
  const [placeSuggestions, setPlaceSuggestions] = useState([])
  const [placeSelection, setPlaceSelection] = useState(null)

  useEffect(() => {
    if (searchTerm.length > 0) {
      updateSuggestions(searchTerm)
    }
  }, [searchTerm])

  function calculateDistance(point1, point2) {
    const R = 6371000
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const distance = measurementPoints.length === 2 ? calculateDistance(...measurementPoints) : null

  const distanceMiles = distance ? (distance * 0.000621371).toFixed(2) : null;

  const updateSuggestions = async (q) => {
    const ql = String(q || '').trim().toLowerCase();
    if (!ql) {
      setSuggestions([]);
      setPlaceSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    
    // Course name matches
    const courseMatches = displayCourses
      .filter(c => (c.name || '').toLowerCase().includes(ql))
      .slice(0, 5);
    setSuggestions(courseMatches);
    
    setActiveIndex(-1);
  };

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQuery(v);
    setSearchTerm(v);
  };

  const handleSelect = (course) => {
    if (!course || !course.location) return;
    setSearchQuery(course.name || '');
    setSuggestions([]);
    setPlaceSuggestions([]);
    setActiveIndex(-1);
    setSearchOpen(false);
    setActiveCourse(course)
    setFilters(filters => {
      var tempFilters = {...filters}
      tempFilters[course.products.split(";").map(s => s.trim())[0].toLowerCase().replace(" ","-")] = true
      tempFilters['push-list'] = course.tags.includes("PUSH")
      return tempFilters
    })
  };

  const handlePlaceSelect = (suggestion) => {
    setSearchQuery(suggestion.placePrediction.text.text || '');
    setSuggestions([]);
    setPlaceSuggestions([]);
    setActiveIndex(-1);
    setSearchOpen(false);
    setPlaceSelection(suggestion);
  };

  // keyboard navigation for suggestions
  const onInputKeyDown = (e) => {
    const totalSuggestions = suggestions.length + placeSuggestions.length;
    if (totalSuggestions === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, totalSuggestions - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        if (activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        } else {
          handlePlaceSelect(placeSuggestions[activeIndex - suggestions.length]);
        }
      } else {
        const first = suggestions[0] || placeSuggestions[0];
        if (first) {
          if (suggestions[0]) handleSelect(first);
          else handlePlaceSelect(first);
        }
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setPlaceSuggestions([]);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    function onDocClick(e) {
      if (suggRef.current && !suggRef.current.contains(e.target)) {
        setSuggestions([]);
        setActiveIndex(-1);
        if (document.activeElement !== inputRef.current) setSearchOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    } else if (!searchOpen) {
      setSearchQuery("")
    }
  }, [searchOpen]);

  useEffect(() => {
    if (activeCourse) setFlyTo({location: {...activeCourse.location}})
  },[activeCourse])

  useEffect(() => {
    if (!measureToggle) {
      setMeasurementPoints([])
    }
  },[measureToggle])

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  useEffect(() => {
    axios.get("/app/data").then(response => {
      console.log(response.data)
      const thisData = response.data
      console.log(Object.values(thisData)[0])
      const groupedCourses = Object.values(thisData).filter(course => course.group !== "None" && !(course.kiosk_ready === "False" && course.products === "Kiosk"))
      setDisplayCourses(groupedCourses)
      setProductCounts({
        "yardage-card": Object.values(thisData).filter(course => course.products.includes("Yardage Card")).length,
        "course-guide": Object.values(thisData).filter(course => course.products.includes("Course Guide")).length,
        "score-card": Object.values(thisData).filter(course => course.products.includes("Score Card")).length,
        "kiosk": Object.values(thisData).filter(course => course.products.includes("Kiosk")).length,
        "pin-sheet": Object.values(thisData).filter(course => course.products.includes("Pin Sheet")).length,
        "push-list": Object.values(thisData).filter(course => course.tags.includes("PUSH")).length
      })
      const queryString = window.location.search;
      const params = new URLSearchParams(queryString)
      const defaultZoom = params.get("zoom")
      const defaultCourse = params.get("course")
      const defaultRadius = params.get("radius")
      console.log(defaultCourse)
      console.log(defaultZoom)
      console.log(defaultRadius)
      var defaultLocation = null
      if (defaultCourse) {
        defaultLocation = thisData[defaultCourse].location
        setActiveCourse(thisData[defaultCourse])
      }
      if (defaultRadius) {
        setAreaRadius(defaultRadius)
        setRadiusToggle(true)
      }
      if (defaultZoom && defaultLocation) {
        setFlyTo({
          "location": {...defaultLocation},
          "zoom": parseInt(defaultZoom)
        })
      } else if (defaultZoom) {
        setFlyTo({
          "zoom": parseInt(defaultZoom)
        })
      } else if (defaultLocation) {
        setFlyTo({
          "location": {...defaultLocation}
        })
      }
    })
  },[])

  useEffect(() => {
    if (displayCourses && filters) {
      var tempObj = {}
      for (const filter in filters) {
        if (filters[filter]) {
          tempObj[filter] = {
            display: "block"
          }
        } else {
          tempObj[filter] = {}
        }
      }
      setStyles(tempObj)
    }
  },[filters])

  const testObj = {
    "name": "Eagle Ridge Resort and Spa",
    "products": "Course Guide; Yardage Card",
    "rounds": 65000,
    "contact": "John Schlaman",
    "restrictions": "Adult Shops; Golf Courses; Gentleman's Clubs",
    "street": "444 Eagle Ridge Drive",
    "city": "Galena",
    "state": "Illinois",
    "zip": 61036,
    "url": "https://www.google.com/maps/search/Eagle+Ridge+Resort+and+Spa+61036",
    "zoho_url": "*****PROPRIETARY INFO *****"
  }

  const handleClick = () => {
    const values = Object.values(displayCourses)
    const filteredValues = values.filter(value => {
      return value.products.includes("Yardage Card")
    })
    setDisplayCourses(filteredValues)
  }

  return (
    <>
      <div style={{"height": "100vh","width":"100vw"}}>
        <div style={{
          position: 'absolute',
          width: 500,
          height: "100%",
          background: (activeCourse ? (activeCourse.tags.includes("PUSH") ? `#e8ffdd` : "#ffeddd") : "#ffeddd"),
          zIndex: 999,
          left: activeCourse ? 0 : -500,
          transition: 'left 0.3s ease-in-out'
        }}>
          {activeCourse && (<>
            <div style={{ background: (activeCourse.tags.includes("PUSH") ? '#6bc22d' : '#e86807'), color: ('white'), height: 70, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ maxWidth: 400, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: 0, marginRight: 0, marginTop: 0, marginLeft: 20 }}>{activeCourse.name}</h2>
              
              <button
                onClick={() => setActiveCourse(null)}
                aria-label="Close info panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  padding: 0,
                  marginRight: 10,
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "16px", color: '#000', overflowY: 'auto', height: 'calc(100% - 102px)',textAlign: 'left'}}>
              {activeCourse.name != null && (
                <div className='infoBox'>
                  <div className='infoTitle'>Course Name</div>
                  <div style={{ fontSize: 14 }}>{activeCourse.name.toLocaleString()}</div>
                </div>
              )}

              {activeCourse.products && (
                <div className='infoBox'>
                  <div className='infoTitle'>Products</div>
                  <div style={{ fontSize: 14 }}>{Array.isArray(activeCourse.products) ? (activeCourse.kiosk_ready !== "False" ? activeCourse.products.join('; ') : activeCourse.products.filter(product => product.toString() !== "Kiosk").join('; ')) : (activeCourse.kiosk_ready !== "False" ? String(activeCourse.products) : activeCourse.products.split(";").filter(product => product.trim() !== "Kiosk").join(";"))}</div>
                </div>
              )}
              
              {activeCourse.rounds != null && (
                <div className='infoBox'>
                  <div className='infoTitle'>Rounds</div>
                  <div style={{ fontSize: 14 }}>{activeCourse.rounds.toLocaleString()}</div>
                </div>
              )}
              
              {activeCourse.contact && (
                <div className='infoBox'>
                  <div className='infoTitle'>Contact</div>
                  <div style={{ fontSize: 14 }}>{activeCourse.contact}</div>
                </div>
              )}
              
              {activeCourse.restrictions && (
                <div className='infoBox'>
                  <div className='infoTitle'>Restrictions</div>
                  <div style={{ fontSize: 14 }}>{activeCourse.restrictions}</div>
                </div>
              )}
              
              {(activeCourse.street || activeCourse.city || activeCourse.state || activeCourse.zip) && (
                <div className='infoBox'>
                  <div className='infoTitle'>Address</div>
                  <div style={{ fontSize: 14 }}>
                    {activeCourse.street}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {[activeCourse.city, activeCourse.state, activeCourse.zip].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              
              {activeCourse.zoho_url && (
                <div className='infoBox'>
                  <div className='infoTitle'>CRM</div>
                  <div style={{ fontSize: 14 }}>
                    <a href={activeCourse.zoho_url} target="_blank" rel="noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>Open in Zoho CRM →</a>
                  </div>
                </div>
              )}

              {activeCourse.super_push !== "False" && activeCourse.tags.includes("PUSH") && (
                <div className='infoBox'>
                  <div className='infoTitle'>Ship Date</div>
                  <div style={{ fontSize: 14 }}>{activeCourse.super_push}</div>
                </div>
              )}

              {activeCourse.tags.includes("PUSH") && (
                <ul style={{
                  display:"flex",
                  justifyContent: "center",
                  alignItems: "center",
                  listStyleType: "none",
                  fontWeight: "1000",
                  textShadow: `-1px -1px 0 black,  
                    1px -1px 0 black,
                    -1px 1px 0 black,
                    1px 1px 0 black,
                  
                    4px 4px 0 rgba(0, 0, 0, .2)`,
                  fontSize: "2rem",
                  padding: 0,
                  fontFamily: "Poppins"
                }}>
                  <li style={{
                    color: '#6bc22d',
                    zIndex: 3005
                  }} className='pushCourse'>
                    <h2>PUSH COURSE</h2>
                  </li>
                  <li style={{
                    color: '#6ca41e',
                    animationDelay: ".1s",
                    position: 'absolute',
                    zIndex: 3004,
                    paddingLeft: '5px'
                  }} className='pushCourse'>
                    <h2>PUSH COURSE</h2>
                  </li>
                  <li style={{
                    color: '#6c7410',
                    animationDelay: ".2s",
                    position: 'absolute',
                    zIndex: 3003,
                    paddingLeft: '10px'
                  }} className='pushCourse'>
                    <h2>PUSH COURSE</h2>
                  </li>
                  <li style={{
                    color: '#59470b',
                    animationDelay: ".3s",
                    position: 'absolute',
                    zIndex: 3002,
                    paddingLeft: '15px'
                  }} className='pushCourse'>
                    <h2>PUSH COURSE</h2>
                  </li>
                </ul>
              )}
            </div>
          </>)}
        </div>
        {/* Search box (top-left) with suggestions */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: activeCourse ? 524 : 24,
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out'
        }} ref={suggRef}>
          {!searchOpen ? (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                padding: 0,
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          ) : (
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={onInputKeyDown}
              placeholder="Search course name..."
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', height: 26, width: 300, background: 'white', color: 'black' }}
              aria-label="Search course"
            />
          )}
          {(suggestions.length > 0 || placeSuggestions.length > 0) && (
            <ul style={{
              margin: 6,
              padding: 0,
              listStyle: 'none',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 6,
              maxHeight: 240,
              overflowY: 'auto',
              width: 300,
              color: "black",
              boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
            }}>
              {/* Course suggestions */}
              {suggestions.length > 0 && (
                <>
                  <li style={{ padding: '6px 10px', fontSize: 11, color: '#666', fontWeight: 'bold', background: '#f5f5f5' }}>
                    COURSES
                  </li>
                  {suggestions.map((s, i) => (
                    <li
                      key={s.course_id || s.name || i}
                      onClick={() => handleSelect(s)}
                      onMouseEnter={() => setActiveIndex(i)}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        background: i === activeIndex ? 'rgba(0,0,0,0.06)' : 'transparent'
                      }}
                    >
                      {s.name}
                    </li>
                  ))}
                </>
              )}
              
              {/* Place suggestions */}
              {placeSuggestions.length > 0 && (
                <>
                  <li style={{ padding: '6px 10px', fontSize: 11, color: '#666', fontWeight: 'bold', background: '#f5f5f5' }}>
                    LOCATIONS
                  </li>
                  {placeSuggestions.map((suggestion, i) => {
                    const globalIndex = suggestions.length + i;
                    return (
                      <li
                        key={suggestion.placePrediction.placeId}
                        onClick={() => handlePlaceSelect(suggestion)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        style={{
                          padding: '8px 10px',
                          cursor: 'pointer',
                          background: globalIndex === activeIndex ? 'rgba(0,0,0,0.06)' : 'transparent'
                        }}
                      >
                        {suggestion.placePrediction.text.text}
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          )}
        </div>
        {/* Add Radius Button */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: activeCourse ? 524 : 24,
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out'
        }} ref={suggRef}>
          <button
            onClick={() => setRadiusToggle(!radiusToggle)}
            aria-label="Radius Toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              padding: 0,
              background: radiusToggle ? '#515151' : '#ffffff',
              border: radiusToggle ? '3px solid #f5ac3c' : '1px solid rgba(0,0,0,0.12)',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={radiusToggle ? '#f5ac3c' : '#000000'} strokeWidth="2">
              <circle cx="16" cy="16" r="14" strokeDasharray="6,2" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="9" />
              <circle cx="16" cy="16" r="1.5" fill={radiusToggle ? '#f5ac3c' : '#000000'} />
              <line x1="16" y1="16" x2="20.364" y2="7.636" />
            </svg>
          </button>
        </div>
        {/* Measure Button */}
        <div style={{
          position: 'absolute',
          bottom: 68,
          left: activeCourse ? 524 : 24,
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out'
        }} ref={suggRef}>
          <button
            onClick={() => setMeasureToggle(!measureToggle)}
            aria-label="Radius Toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              padding: 0,
              background: measureToggle ? '#515151' : '#ffffff',
              border: measureToggle ? '3px solid #f5ac3c' : '1px solid rgba(0,0,0,0.12)',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={measureToggle ? '#f5ac3c' : '#000000'} strokeWidth="2.5">
              {/* Ruler body - horizontal rectangle */}
              <rect x="4" y="10" width="24" height="12" rx="1" fill="none" strokeWidth="2" />
              {/* Measurement tick marks */}
              <line x1="8" y1="22" x2="8" y2="15" strokeWidth="1.5" />
              <line x1="12" y1="22" x2="12" y2="17" strokeWidth="1" />
              <line x1="16" y1="22" x2="16" y2="15" strokeWidth="1.5" />
              <line x1="20" y1="22" x2="20" y2="17" strokeWidth="1" />
              <line x1="24" y1="22" x2="24" y2="15" strokeWidth="1.5" />
            </svg>
          </button>
          {measurementPoints.length === 2 ?
            <div style={{
                position: 'absolute',
                left: 44,
                height: 25,
                width: 120,
                transform: 'translateY(-110%)',
                background: 'white',
                padding: '6px 12px',
                borderRadius: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                fontWeight: 'bold',
                zIndex: 1001,
                color: 'black'
            }}>
                {distanceMiles} miles
            </div>
            : null}
        </div>
        {/* Overlay: 3 checkbox-buttons in top-right */}
        
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Yardage Card', key: 'yardage-card' },
            { label: 'Course Guide', key: 'course-guide' },
            { label: 'Score Card', key: 'score-card' },
            { label: 'Kiosk', key: 'kiosk' },
            { label: 'Pin Sheet', key: 'pin-sheet' },
            { label: 'Push Course', key: 'push-list' },
          ].map(item => (
            <label
              key={item.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.1)',
                padding: '8px 12px',
                borderRadius: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                userSelect: 'none',
                width: 170
              }}
            >
              {/* input inside label: clicking anywhere in the label toggles the checkbox */}
              <input
                type="checkbox"
                checked={!!filters[item.key]}
                onChange={() => toggleFilter(item.key)}
                style={{ width: 16, height: 16 }}
                aria-label={item.label}
              />
              <span style={{ flex: 1, textAlign: 'left', fontSize: 14, color: '#111' }}>{item.label}</span>
              <span style={{ flex: 0, textAlign: 'left', fontSize: 10, color: '#737373' }}>{productCounts[item.key]}</span>
            </label>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 20, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
          <img src="*****PROPRIETARY INFO *****" alt="dfLogo" />
        </div>
        <APIProvider
          className='fullscreen'
          apiKey='*****PROPRIETARY INFO *****'
        >
          <Place_Data
            searchTerm={searchTerm}
            setPlaceSuggestions={setPlaceSuggestions}
            placeSelection={placeSelection}
            setFlyTo={setFlyTo}
          />
          <MapRender
            flyTo={flyTo}
            displayCourses={displayCourses}
            styles={styles}
            setActiveCourse={setActiveCourse}
            activeCourse={activeCourse}
            radiusToggle={radiusToggle}
            areaRadius={areaRadius}
            measureToggle={measureToggle}
            measurementPoints={measurementPoints}
            setMeasurementPoints={setMeasurementPoints}
            placeSelection={placeSelection}
          />
        </APIProvider>
      </div>
    </>
  )
}