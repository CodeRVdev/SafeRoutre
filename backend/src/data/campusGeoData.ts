// Auto-generated GIS Dataset for Polonuling National High School (DepEd ID: 304561)
export interface FeatureCollection { type: string; features: any[]; }

export const campusBoundaryData: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "campus_boundary",
        "name": "Polonuling National High School Property Extent",
        "type": "campus_boundary",
        "area_sqm": 11530,
        "source": "satellite imagery + cadastral alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96749083098919,
              6.288479558935078
            ],
            [
              124.9679162931797,
              6.28835560976328
            ],
            [
              124.96816436884914,
              6.28809045623185
            ],
            [
              124.96830769437786,
              6.287840066063072
            ],
            [
              124.96830160609304,
              6.2876937585768715
            ],
            [
              124.96822898512454,
              6.287441499019973
            ],
            [
              124.96800048871499,
              6.287358217866839
            ],
            [
              124.96758370682029,
              6.287344390236719
            ],
            [
              124.96712936168313,
              6.287606622632861
            ],
            [
              124.96723948424685,
              6.287967989501958
            ],
            [
              124.96732959853699,
              6.288176115272479
            ],
            [
              124.96749083098919,
              6.288479558935078
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "barangay_access_road",
        "name": "Barangay Access Road (Polonuling Main Thoroughfare)",
        "type": "road",
        "source": "satellite imagery",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96840376422278,
            6.287963079502338
          ],
          [
            124.96817604532232,
            6.287264808265196
          ]
        ]
      }
    }
  ]
};
export const schoolGroundData: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "school_ground",
        "name": "School Ground (Central Open Field)",
        "type": "school_ground",
        "capacity": 2500,
        "status": "primary_evacuation_area",
        "source": "school evacuation plan + satellite alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96749303320789,
              6.287873029441955
            ],
            [
              124.96778030765626,
              6.28772017736654
            ],
            [
              124.96789911051577,
              6.287943767433719
            ],
            [
              124.96761183606742,
              6.288096619509134
            ],
            [
              124.96749303320789,
              6.287873029441955
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "assembly_oval",
        "name": "Evacuation Assembly Area (Designated Safe Zone)",
        "type": "assembly_area",
        "capacity": 1800,
        "status": "safe_staging",
        "source": "school evacuation plan + satellite alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96754192442812,
              6.287887987316188
            ],
            [
              124.96776536011018,
              6.287769102368643
            ],
            [
              124.96785021929556,
              6.287928809559485
            ],
            [
              124.9676267836135,
              6.28804769450703
            ],
            [
              124.96754192442812,
              6.287887987316188
            ]
          ]
        ]
      }
    }
  ]
};
export const buildingsData: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "school_gym",
        "name": "School GYM (Covered Court)",
        "code": "GYM",
        "type": "building",
        "buildingType": "sports_and_assembly",
        "floorCount": 1,
        "height": 12,
        "min_height": 0,
        "color": "#0284c7",
        "roofColor": "#0284c7",
        "strokeColor": "#bae6fd",
        "status": "operational",
        "source": "satellite imagery blue roof structure",
        "verified": true,
        "lat": 6.288220895321925,
        "lng": 124.96752842540121
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9673913469932,
              6.288155551877944
            ],
            [
              124.96755094390896,
              6.288070634058269
            ],
            [
              124.96766550380922,
              6.288286238765906
            ],
            [
              124.96750590689345,
              6.2883711565855815
            ],
            [
              124.9673913469932,
              6.288155551877944
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "stage_gym",
        "name": "Stage (Gymnasium)",
        "code": "STG-GYM",
        "type": "building",
        "buildingType": "stage",
        "floorCount": 1,
        "height": 6,
        "min_height": 0,
        "color": "#0369a1",
        "roofColor": "#38bdf8",
        "strokeColor": "#e0f2fe",
        "status": "operational",
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288334719727753,
        "lng": 124.96763599011162
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96758896733465,
              6.288313646228257
            ],
            [
              124.96764482625517,
              6.2882839249913705
            ],
            [
              124.96768301288859,
              6.288355793227249
            ],
            [
              124.96762715396807,
              6.288385514464136
            ],
            [
              124.96758896733465,
              6.288313646228257
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_north",
        "name": "JHS Building (North-Center)",
        "code": "JHS-NC",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + user directional annotation alignment",
        "verified": true,
        "lat": 6.288080847330325,
        "lng": 124.9676761302992
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96773390625728,
              6.288006573587926
            ],
            [
              124.96776997141107,
              6.288074449144034
            ],
            [
              124.9676183543411,
              6.288155121072725
            ],
            [
              124.96758228918732,
              6.288087245516617
            ],
            [
              124.96773390625728,
              6.288006573587926
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "shs_north",
        "name": "SHS Building (North)",
        "code": "SHS-N",
        "type": "building",
        "buildingType": "academic_senior_high",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + user directional annotation alignment",
        "verified": true,
        "lat": 6.288048056367802,
        "lng": 124.96787058952596
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96793235540694,
              6.2879716596799105
            ],
            [
              124.96796842056072,
              6.2880395352360186
            ],
            [
              124.96780882364497,
              6.288124453055693
            ],
            [
              124.96777275849118,
              6.288056577499586
            ],
            [
              124.96793235540694,
              6.2879716596799105
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "bcd_building",
        "name": "BCD Building (School ID 304561)",
        "code": "BCD",
        "type": "building",
        "buildingType": "academic_and_techvoc",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#c2410c",
        "roofColor": "#ea580c",
        "strokeColor": "#fdba74",
        "status": "operational",
        "source": "satellite imagery (304561) + evacuation plan",
        "verified": true,
        "lat": 6.288028105401189,
        "lng": 124.96740756340115
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96731861710424,
              6.28794739491634
            ],
            [
              124.96739043571634,
              6.2879091818974855
            ],
            [
              124.96749650969805,
              6.288108815886038
            ],
            [
              124.96742469108595,
              6.288147028904892
            ],
            [
              124.96731861710424,
              6.28794739491634
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "boq_building",
        "name": "BOQ Building / JHS West",
        "code": "BOQ",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.287781396693654,
        "lng": 124.96730718423194
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96723308829247,
              6.287728634967202
            ],
            [
              124.96730490690457,
              6.287690421948348
            ],
            [
              124.96738128017141,
              6.287834158420106
            ],
            [
              124.96730946155931,
              6.28787237143896
            ],
            [
              124.96723308829247,
              6.287728634967202
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "school_clinic",
        "name": "School Clinic",
        "code": "CLINIC",
        "type": "building",
        "buildingType": "health_and_first_aid",
        "floorCount": 1,
        "height": 6,
        "min_height": 0,
        "color": "#059669",
        "roofColor": "#10b981",
        "strokeColor": "#a7f3d0",
        "status": "operational",
        "source": "satellite imagery + user explicit handwritten annotation (southeast structure)",
        "verified": true,
        "lat": 6.287341156498271,
        "lng": 124.96797095155375
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96790958449209,
              6.287312350850446
            ],
            [
              124.96798140310419,
              6.2872741378315915
            ],
            [
              124.96803231861541,
              6.287369962146097
            ],
            [
              124.96796050000331,
              6.28740817516495
            ],
            [
              124.96790958449209,
              6.287312350850446
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "stage_ground",
        "name": "Stage (School Ground)",
        "code": "STG-GND",
        "type": "building",
        "buildingType": "assembly_stage",
        "floorCount": 1,
        "height": 5,
        "min_height": 0,
        "color": "#0284c7",
        "roofColor": "#38bdf8",
        "strokeColor": "#bae6fd",
        "status": "operational",
        "source": "satellite imagery blue roof structure + user directional annotation",
        "verified": true,
        "lat": 6.287620765164046,
        "lng": 124.9679209436394
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.967861445021,
              6.287585843890957
            ],
            [
              124.96792528378731,
              6.287551876763088
            ],
            [
              124.9679804422578,
              6.287655686437135
            ],
            [
              124.9679166034915,
              6.287689653565005
            ],
            [
              124.967861445021,
              6.287585843890957
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "shs_south",
        "name": "SHS Building (South Wing)",
        "code": "SHS-S",
        "type": "building",
        "buildingType": "academic_senior_high",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + evacuation plan alignment",
        "verified": true,
        "lat": 6.287488232021658,
        "lng": 124.96757517834631
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9678375011118,
              6.287307684399058
            ],
            [
              124.96787144478596,
              6.287371567275395
            ],
            [
              124.9673128555808,
              6.287668779644258
            ],
            [
              124.96727891190666,
              6.28760489676792
            ],
            [
              124.9678375011118,
              6.287307684399058
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "admin_building",
        "name": "ADMIN Building",
        "code": "ADMIN",
        "type": "building",
        "buildingType": "administration_and_faculty",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery physical roof (6.287861, 124.968125)",
        "verified": true,
        "lat": 6.2878682294765245,
        "lng": 124.968071880043
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96799379418064,
              6.287817590695564
            ],
            [
              124.96807359263852,
              6.287775131785727
            ],
            [
              124.96814996590535,
              6.287918868257485
            ],
            [
              124.96807016744748,
              6.287961327167322
            ],
            [
              124.96799379418064,
              6.287817590695564
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_east_top",
        "name": "JHS Building (East-Top)",
        "code": "JHS-ET",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + user curved directional annotation (gate road frontage)",
        "verified": true,
        "lat": 6.287714536280302,
        "lng": 124.96819902803921
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96813740794119,
              6.287675622327442
            ],
            [
              124.96820124670748,
              6.287641655199573
            ],
            [
              124.96826064813725,
              6.287753450233162
            ],
            [
              124.96819680937094,
              6.287787417361032
            ],
            [
              124.96813740794119,
              6.287675622327442
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_east_bottom_1",
        "name": "JHS Building (East-Bottom 1)",
        "code": "JHS-EB1",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery green classroom wing north section",
        "verified": true,
        "lat": 6.2875783062542085,
        "lng": 124.96800074209727
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96794149651525,
              6.287553493286154
            ],
            [
              124.96801331512735,
              6.2875152802673
            ],
            [
              124.9680599876793,
              6.287603119222263
            ],
            [
              124.96798816906721,
              6.287641332241117
            ],
            [
              124.96794149651525,
              6.287553493286154
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_east_bottom_2",
        "name": "JHS Building (East-Bottom 2)",
        "code": "JHS-EB2",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery green classroom wing south section",
        "verified": true,
        "lat": 6.2874904672992455,
        "lng": 124.96795406954533
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9678948239633,
              6.28746565433119
            ],
            [
              124.96796664257539,
              6.287427441312337
            ],
            [
              124.96801331512735,
              6.2875152802673
            ],
            [
              124.96794149651525,
              6.287553493286154
            ],
            [
              124.9678948239633,
              6.28746565433119
            ]
          ]
        ]
      }
    }
  ]
};
export const gatesData: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "gate_entrance",
        "name": "SCHOOL GATE (ENTRANCE)",
        "type": "gate_entrance",
        "status": "Main Campus Entrance Gate",
        "source": "primary spatial reference (6.287711, 124.968270)",
        "verified": true,
        "lng": 124.96826968670989,
        "lat": 6.287710742140806
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          124.96826968670989,
          6.287710742140806
        ]
      }
    }
  ]
};
export const pathwaysData: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "p_driveway_1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96826968670989,
            6.287710742140806
          ],
          [
            124.96820035556019,
            6.287799870631686
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_driveway_admin",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.968071880043,
            6.2878682294765245
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_plaza_to_jhset",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.96819902803921,
            6.287714536280302
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_to_anchor3",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.96799952821452,
            6.287949746554718
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_anchor3_to_shs_n",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96799952821452,
            6.287949746554718
          ],
          [
            124.96787058952596,
            6.288048056367802
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_anchor3_to_shs_walk",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96799952821452,
            6.287949746554718
          ],
          [
            124.967841313107,
            6.287992957386962
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_shs_walk_to_jhs_n",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.967841313107,
            6.287992957386962
          ],
          [
            124.9676761302992,
            6.288080847330325
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_jhs_walk_to_gym",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.9676761302992,
            6.288080847330325
          ],
          [
            124.96758994796468,
            6.288126702952949
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gym_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96758994796468,
            6.288126702952949
          ],
          [
            124.96752842540121,
            6.288220895321925
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gym_stage_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96758994796468,
            6.288126702952949
          ],
          [
            124.96763599011162,
            6.288334719727753
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96758994796468,
            6.288126702952949
          ],
          [
            124.96750890744265,
            6.287974182585695
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_bcd_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96750890744265,
            6.287974182585695
          ],
          [
            124.96740756340115,
            6.288028105401189
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_2",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96750890744265,
            6.287974182585695
          ],
          [
            124.96738458873608,
            6.287740211551111
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_boq_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96738458873608,
            6.287740211551111
          ],
          [
            124.96730718423194,
            6.287781396693654
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_3",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96738458873608,
            6.287740211551111
          ],
          [
            124.96733240033707,
            6.287641991628743
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96733240033707,
            6.287641991628743
          ],
          [
            124.96760233328563,
            6.287539338322727
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_shs_s_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96760233328563,
            6.287539338322727
          ],
          [
            124.96757517834631,
            6.287488232021658
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_2",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96760233328563,
            6.287539338322727
          ],
          [
            124.96778756324247,
            6.28757393997374
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_stage_gnd_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96778756324247,
            6.28757393997374
          ],
          [
            124.9679209436394,
            6.287620765164046
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_to_eb2",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96778756324247,
            6.28757393997374
          ],
          [
            124.96790140256313,
            6.287518490179738
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb2_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96790140256313,
            6.287518490179738
          ],
          [
            124.96795406954533,
            6.2874904672992455
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb2_to_eb1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96790140256313,
            6.287518490179738
          ],
          [
            124.96794807511507,
            6.287606329134701
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb1_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96794807511507,
            6.287606329134701
          ],
          [
            124.96800074209727,
            6.2875783062542085
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb1_to_admin",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96794807511507,
            6.287606329134701
          ],
          [
            124.968071880043,
            6.2878682294765245
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb2_to_clinic_junc",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96790140256313,
            6.287518490179738
          ],
          [
            124.96789115309588,
            6.287383615408109
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_clinic_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96789115309588,
            6.287383615408109
          ],
          [
            124.96797095155375,
            6.287341156498271
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_east",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_north",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.967841313107,
            6.287992957386962
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_west",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96750890744265,
            6.287974182585695
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_south",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96760233328563,
            6.287539338322727
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    }
  ]
};
export const fullCampusData: FeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "campus_boundary",
        "name": "Polonuling National High School Property Extent",
        "type": "campus_boundary",
        "area_sqm": 11530,
        "source": "satellite imagery + cadastral alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96749083098919,
              6.288479558935078
            ],
            [
              124.9679162931797,
              6.28835560976328
            ],
            [
              124.96816436884914,
              6.28809045623185
            ],
            [
              124.96830769437786,
              6.287840066063072
            ],
            [
              124.96830160609304,
              6.2876937585768715
            ],
            [
              124.96822898512454,
              6.287441499019973
            ],
            [
              124.96800048871499,
              6.287358217866839
            ],
            [
              124.96758370682029,
              6.287344390236719
            ],
            [
              124.96712936168313,
              6.287606622632861
            ],
            [
              124.96723948424685,
              6.287967989501958
            ],
            [
              124.96732959853699,
              6.288176115272479
            ],
            [
              124.96749083098919,
              6.288479558935078
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "barangay_access_road",
        "name": "Barangay Access Road (Polonuling Main Thoroughfare)",
        "type": "road",
        "source": "satellite imagery",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96840376422278,
            6.287963079502338
          ],
          [
            124.96817604532232,
            6.287264808265196
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "school_ground",
        "name": "School Ground (Central Open Field)",
        "type": "school_ground",
        "capacity": 2500,
        "status": "primary_evacuation_area",
        "source": "school evacuation plan + satellite alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96749303320789,
              6.287873029441955
            ],
            [
              124.96778030765626,
              6.28772017736654
            ],
            [
              124.96789911051577,
              6.287943767433719
            ],
            [
              124.96761183606742,
              6.288096619509134
            ],
            [
              124.96749303320789,
              6.287873029441955
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "assembly_oval",
        "name": "Evacuation Assembly Area (Designated Safe Zone)",
        "type": "assembly_area",
        "capacity": 1800,
        "status": "safe_staging",
        "source": "school evacuation plan + satellite alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96754192442812,
              6.287887987316188
            ],
            [
              124.96776536011018,
              6.287769102368643
            ],
            [
              124.96785021929556,
              6.287928809559485
            ],
            [
              124.9676267836135,
              6.28804769450703
            ],
            [
              124.96754192442812,
              6.287887987316188
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "school_gym",
        "name": "School GYM (Covered Court)",
        "code": "GYM",
        "type": "building",
        "buildingType": "sports_and_assembly",
        "floorCount": 1,
        "height": 12,
        "min_height": 0,
        "color": "#0284c7",
        "roofColor": "#0284c7",
        "strokeColor": "#bae6fd",
        "status": "operational",
        "source": "satellite imagery blue roof structure",
        "verified": true,
        "lat": 6.288220895321925,
        "lng": 124.96752842540121
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9673913469932,
              6.288155551877944
            ],
            [
              124.96755094390896,
              6.288070634058269
            ],
            [
              124.96766550380922,
              6.288286238765906
            ],
            [
              124.96750590689345,
              6.2883711565855815
            ],
            [
              124.9673913469932,
              6.288155551877944
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "stage_gym",
        "name": "Stage (Gymnasium)",
        "code": "STG-GYM",
        "type": "building",
        "buildingType": "stage",
        "floorCount": 1,
        "height": 6,
        "min_height": 0,
        "color": "#0369a1",
        "roofColor": "#38bdf8",
        "strokeColor": "#e0f2fe",
        "status": "operational",
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288334719727753,
        "lng": 124.96763599011162
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96758896733465,
              6.288313646228257
            ],
            [
              124.96764482625517,
              6.2882839249913705
            ],
            [
              124.96768301288859,
              6.288355793227249
            ],
            [
              124.96762715396807,
              6.288385514464136
            ],
            [
              124.96758896733465,
              6.288313646228257
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_north",
        "name": "JHS Building (North-Center)",
        "code": "JHS-NC",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + user directional annotation alignment",
        "verified": true,
        "lat": 6.288080847330325,
        "lng": 124.9676761302992
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96773390625728,
              6.288006573587926
            ],
            [
              124.96776997141107,
              6.288074449144034
            ],
            [
              124.9676183543411,
              6.288155121072725
            ],
            [
              124.96758228918732,
              6.288087245516617
            ],
            [
              124.96773390625728,
              6.288006573587926
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "shs_north",
        "name": "SHS Building (North)",
        "code": "SHS-N",
        "type": "building",
        "buildingType": "academic_senior_high",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + user directional annotation alignment",
        "verified": true,
        "lat": 6.288048056367802,
        "lng": 124.96787058952596
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96793235540694,
              6.2879716596799105
            ],
            [
              124.96796842056072,
              6.2880395352360186
            ],
            [
              124.96780882364497,
              6.288124453055693
            ],
            [
              124.96777275849118,
              6.288056577499586
            ],
            [
              124.96793235540694,
              6.2879716596799105
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "bcd_building",
        "name": "BCD Building (School ID 304561)",
        "code": "BCD",
        "type": "building",
        "buildingType": "academic_and_techvoc",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#c2410c",
        "roofColor": "#ea580c",
        "strokeColor": "#fdba74",
        "status": "operational",
        "source": "satellite imagery (304561) + evacuation plan",
        "verified": true,
        "lat": 6.288028105401189,
        "lng": 124.96740756340115
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96731861710424,
              6.28794739491634
            ],
            [
              124.96739043571634,
              6.2879091818974855
            ],
            [
              124.96749650969805,
              6.288108815886038
            ],
            [
              124.96742469108595,
              6.288147028904892
            ],
            [
              124.96731861710424,
              6.28794739491634
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "boq_building",
        "name": "BOQ Building / JHS West",
        "code": "BOQ",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.287781396693654,
        "lng": 124.96730718423194
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96723308829247,
              6.287728634967202
            ],
            [
              124.96730490690457,
              6.287690421948348
            ],
            [
              124.96738128017141,
              6.287834158420106
            ],
            [
              124.96730946155931,
              6.28787237143896
            ],
            [
              124.96723308829247,
              6.287728634967202
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "school_clinic",
        "name": "School Clinic",
        "code": "CLINIC",
        "type": "building",
        "buildingType": "health_and_first_aid",
        "floorCount": 1,
        "height": 6,
        "min_height": 0,
        "color": "#059669",
        "roofColor": "#10b981",
        "strokeColor": "#a7f3d0",
        "status": "operational",
        "source": "satellite imagery + user explicit handwritten annotation (southeast structure)",
        "verified": true,
        "lat": 6.287341156498271,
        "lng": 124.96797095155375
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96790958449209,
              6.287312350850446
            ],
            [
              124.96798140310419,
              6.2872741378315915
            ],
            [
              124.96803231861541,
              6.287369962146097
            ],
            [
              124.96796050000331,
              6.28740817516495
            ],
            [
              124.96790958449209,
              6.287312350850446
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "stage_ground",
        "name": "Stage (School Ground)",
        "code": "STG-GND",
        "type": "building",
        "buildingType": "assembly_stage",
        "floorCount": 1,
        "height": 5,
        "min_height": 0,
        "color": "#0284c7",
        "roofColor": "#38bdf8",
        "strokeColor": "#bae6fd",
        "status": "operational",
        "source": "satellite imagery blue roof structure + user directional annotation",
        "verified": true,
        "lat": 6.287620765164046,
        "lng": 124.9679209436394
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.967861445021,
              6.287585843890957
            ],
            [
              124.96792528378731,
              6.287551876763088
            ],
            [
              124.9679804422578,
              6.287655686437135
            ],
            [
              124.9679166034915,
              6.287689653565005
            ],
            [
              124.967861445021,
              6.287585843890957
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "shs_south",
        "name": "SHS Building (South Wing)",
        "code": "SHS-S",
        "type": "building",
        "buildingType": "academic_senior_high",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + evacuation plan alignment",
        "verified": true,
        "lat": 6.287488232021658,
        "lng": 124.96757517834631
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9678375011118,
              6.287307684399058
            ],
            [
              124.96787144478596,
              6.287371567275395
            ],
            [
              124.9673128555808,
              6.287668779644258
            ],
            [
              124.96727891190666,
              6.28760489676792
            ],
            [
              124.9678375011118,
              6.287307684399058
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "admin_building",
        "name": "ADMIN Building",
        "code": "ADMIN",
        "type": "building",
        "buildingType": "administration_and_faculty",
        "floorCount": 2,
        "height": 9,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery physical roof (6.287861, 124.968125)",
        "verified": true,
        "lat": 6.2878682294765245,
        "lng": 124.968071880043
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96799379418064,
              6.287817590695564
            ],
            [
              124.96807359263852,
              6.287775131785727
            ],
            [
              124.96814996590535,
              6.287918868257485
            ],
            [
              124.96807016744748,
              6.287961327167322
            ],
            [
              124.96799379418064,
              6.287817590695564
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_east_top",
        "name": "JHS Building (East-Top)",
        "code": "JHS-ET",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery + user curved directional annotation (gate road frontage)",
        "verified": true,
        "lat": 6.287714536280302,
        "lng": 124.96819902803921
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96813740794119,
              6.287675622327442
            ],
            [
              124.96820124670748,
              6.287641655199573
            ],
            [
              124.96826064813725,
              6.287753450233162
            ],
            [
              124.96819680937094,
              6.287787417361032
            ],
            [
              124.96813740794119,
              6.287675622327442
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_east_bottom_1",
        "name": "JHS Building (East-Bottom 1)",
        "code": "JHS-EB1",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery green classroom wing north section",
        "verified": true,
        "lat": 6.2875783062542085,
        "lng": 124.96800074209727
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96794149651525,
              6.287553493286154
            ],
            [
              124.96801331512735,
              6.2875152802673
            ],
            [
              124.9680599876793,
              6.287603119222263
            ],
            [
              124.96798816906721,
              6.287641332241117
            ],
            [
              124.96794149651525,
              6.287553493286154
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "jhs_east_bottom_2",
        "name": "JHS Building (East-Bottom 2)",
        "code": "JHS-EB2",
        "type": "building",
        "buildingType": "academic_junior_high",
        "floorCount": 1,
        "height": 7,
        "min_height": 0,
        "color": "#b91c1c",
        "roofColor": "#dc2626",
        "strokeColor": "#fca5a5",
        "status": "operational",
        "source": "satellite imagery green classroom wing south section",
        "verified": true,
        "lat": 6.2874904672992455,
        "lng": 124.96795406954533
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9678948239633,
              6.28746565433119
            ],
            [
              124.96796664257539,
              6.287427441312337
            ],
            [
              124.96801331512735,
              6.2875152802673
            ],
            [
              124.96794149651525,
              6.287553493286154
            ],
            [
              124.9678948239633,
              6.28746565433119
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "gate_entrance",
        "name": "SCHOOL GATE (ENTRANCE)",
        "type": "gate_entrance",
        "status": "Main Campus Entrance Gate",
        "source": "primary spatial reference (6.287711, 124.968270)",
        "verified": true,
        "lng": 124.96826968670989,
        "lat": 6.287710742140806
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          124.96826968670989,
          6.287710742140806
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_driveway_1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96826968670989,
            6.287710742140806
          ],
          [
            124.96820035556019,
            6.287799870631686
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_driveway_admin",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.968071880043,
            6.2878682294765245
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_plaza_to_jhset",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.96819902803921,
            6.287714536280302
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_to_anchor3",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.96799952821452,
            6.287949746554718
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_anchor3_to_shs_n",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96799952821452,
            6.287949746554718
          ],
          [
            124.96787058952596,
            6.288048056367802
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_anchor3_to_shs_walk",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96799952821452,
            6.287949746554718
          ],
          [
            124.967841313107,
            6.287992957386962
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_shs_walk_to_jhs_n",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.967841313107,
            6.287992957386962
          ],
          [
            124.9676761302992,
            6.288080847330325
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_jhs_walk_to_gym",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.9676761302992,
            6.288080847330325
          ],
          [
            124.96758994796468,
            6.288126702952949
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gym_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96758994796468,
            6.288126702952949
          ],
          [
            124.96752842540121,
            6.288220895321925
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gym_stage_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96758994796468,
            6.288126702952949
          ],
          [
            124.96763599011162,
            6.288334719727753
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96758994796468,
            6.288126702952949
          ],
          [
            124.96750890744265,
            6.287974182585695
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_bcd_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96750890744265,
            6.287974182585695
          ],
          [
            124.96740756340115,
            6.288028105401189
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_2",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96750890744265,
            6.287974182585695
          ],
          [
            124.96738458873608,
            6.287740211551111
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_boq_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96738458873608,
            6.287740211551111
          ],
          [
            124.96730718423194,
            6.287781396693654
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_3",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96738458873608,
            6.287740211551111
          ],
          [
            124.96733240033707,
            6.287641991628743
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96733240033707,
            6.287641991628743
          ],
          [
            124.96760233328563,
            6.287539338322727
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_shs_s_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96760233328563,
            6.287539338322727
          ],
          [
            124.96757517834631,
            6.287488232021658
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_2",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96760233328563,
            6.287539338322727
          ],
          [
            124.96778756324247,
            6.28757393997374
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_stage_gnd_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96778756324247,
            6.28757393997374
          ],
          [
            124.9679209436394,
            6.287620765164046
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_to_eb2",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96778756324247,
            6.28757393997374
          ],
          [
            124.96790140256313,
            6.287518490179738
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb2_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96790140256313,
            6.287518490179738
          ],
          [
            124.96795406954533,
            6.2874904672992455
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb2_to_eb1",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96790140256313,
            6.287518490179738
          ],
          [
            124.96794807511507,
            6.287606329134701
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb1_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96794807511507,
            6.287606329134701
          ],
          [
            124.96800074209727,
            6.2875783062542085
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb1_to_admin",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96794807511507,
            6.287606329134701
          ],
          [
            124.968071880043,
            6.2878682294765245
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_eb2_to_clinic_junc",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96790140256313,
            6.287518490179738
          ],
          [
            124.96789115309588,
            6.287383615408109
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_clinic_door",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96789115309588,
            6.287383615408109
          ],
          [
            124.96797095155375,
            6.287341156498271
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_east",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96820035556019,
            6.287799870631686
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_north",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.967841313107,
            6.287992957386962
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_west",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96750890744265,
            6.287974182585695
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_south",
        "type": "pathway",
        "walkable": true,
        "status": "clear",
        "source": "satellite visible paved walkways + evacuation plan",
        "verified": true
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            124.96760233328563,
            6.287539338322727
          ],
          [
            124.96769607186184,
            6.287908398437837
          ]
        ]
      }
    }
  ]
};
export const campusConfig = {
  "schoolName": "Polonuling National High School",
  "schoolId": "304561",
  "location": "Barangay Polonuling, Tupi, South Cotabato, Philippines",
  "authoritativeCenter": {
    "lat": 6.28785,
    "lng": 124.96775
  },
  "plusCode": "6QR67XQ9+43",
  "calibrationDatum": {
    "rotationDeg": -28,
    "metersPerDegreeLat": 110570.8,
    "metersPerDegreeLng": 110647.2
  },
  "layerCounts": {
    "buildings": 13,
    "pathways": 30,
    "gates": 1,
    "evacuationAreas": 2
  }
};
