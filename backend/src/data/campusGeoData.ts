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
        "area_sqm": 18500,
        "source": "satellite imagery + cadastral alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96723870391837,
              6.289070790194018
            ],
            [
              124.96835588232867,
              6.288476365456294
            ],
            [
              124.9677830828274,
              6.2873983419181085
            ],
            [
              124.9666659044171,
              6.287992766655833
            ],
            [
              124.96723870391837,
              6.289070790194018
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
            124.96722254984951,
            6.289233029496987
          ],
          [
            124.9665224615702,
            6.287915445172539
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
              124.96728926747498,
              6.28818347955231
            ],
            [
              124.9676723000728,
              6.28797967678509
            ],
            [
              124.967833532525,
              6.28828312044769
            ],
            [
              124.96745049992718,
              6.28848692321491
            ],
            [
              124.96728926747498,
              6.28818347955231
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
              124.96736260430532,
              6.28820591636366
            ],
            [
              124.96764987875369,
              6.288053064288245
            ],
            [
              124.96776019569467,
              6.28826068363634
            ],
            [
              124.9674729212463,
              6.288413535711755
            ],
            [
              124.96736260430532,
              6.28820591636366
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
        "source": "satellite imagery + evacuation plan",
        "verified": true,
        "lat": 6.288715071083917,
        "lng": 124.96738747892911
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96721312884455,
              6.288695166384694
            ],
            [
              124.96746848390976,
              6.288559297873214
            ],
            [
              124.96756182901368,
              6.288734975783141
            ],
            [
              124.96730647394845,
              6.288870844294621
            ],
            [
              124.96721312884455,
              6.288695166384694
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
        "lat": 6.288678065421495,
        "lng": 124.96757253360047
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96750293365666,
              6.288643397359619
            ],
            [
              124.96758273211454,
              6.288600938449782
            ],
            [
              124.9676421335443,
              6.288712733483371
            ],
            [
              124.96756233508643,
              6.288755192393209
            ],
            [
              124.96750293365666,
              6.288643397359619
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288501374666718,
        "lng": 124.96751959379826
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96741645906441,
              6.288499914099074
            ],
            [
              124.96757605598016,
              6.288414996279399
            ],
            [
              124.96762272853212,
              6.288502835234362
            ],
            [
              124.96746313161636,
              6.2885877530540375
            ],
            [
              124.96741645906441,
              6.288499914099074
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288415444002192,
        "lng": 124.9677195960157
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96760848143606,
              6.288418229325532
            ],
            [
              124.96778403804339,
              6.28832481972389
            ],
            [
              124.96783071059535,
              6.288412658678853
            ],
            [
              124.96765515398802,
              6.288506068280495
            ],
            [
              124.96760848143606,
              6.288418229325532
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
        "lat": 6.288299832387728,
        "lng": 124.96716684504715
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96701738798635,
              6.288143767409654
            ],
            [
              124.96712112598159,
              6.288088570826865
            ],
            [
              124.96731630210795,
              6.288455897365802
            ],
            [
              124.9672125641127,
              6.288511093948591
            ],
            [
              124.96701738798635,
              6.288143767409654
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
        "lat": 6.28811122229327,
        "lng": 124.96694379811963
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9668537424886,
              6.288066952348784
            ],
            [
              124.96695748048383,
              6.2880117557659965
            ],
            [
              124.96703385375066,
              6.288155492237754
            ],
            [
              124.96693011575543,
              6.288210688820543
            ],
            [
              124.9668537424886,
              6.288066952348784
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
        "source": "satellite imagery (mint green roof) + evacuation plan",
        "verified": true,
        "lat": 6.288063699159178,
        "lng": 124.96722562308595
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96713132449564,
              6.288011443855152
            ],
            [
              124.96723506249089,
              6.287956247272363
            ],
            [
              124.96731992167626,
              6.288115954463205
            ],
            [
              124.96721618368102,
              6.288171151045994
            ],
            [
              124.96713132449564,
              6.288011443855152
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288057622090073,
        "lng": 124.96746805489609
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96737128460113,
              6.288068139561743
            ],
            [
              124.9675308815169,
              6.287983221742068
            ],
            [
              124.96756482519103,
              6.288047104618404
            ],
            [
              124.96740522827528,
              6.288132022438079
            ],
            [
              124.96737128460113,
              6.288068139561743
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.28787345239818,
        "lng": 124.96739066948375
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96722955434974,
              6.287897720387651
            ],
            [
              124.96750086910653,
              6.287753360094203
            ],
            [
              124.96755178461775,
              6.287849184408708
            ],
            [
              124.96728046986097,
              6.2879935447021555
            ],
            [
              124.96722955434974,
              6.287897720387651
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.287977144672963,
        "lng": 124.96777331332702
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96767078185455,
              6.287919026954886
            ],
            [
              124.96778249969559,
              6.287859584481113
            ],
            [
              124.9678758447995,
              6.28803526239104
            ],
            [
              124.96776412695846,
              6.288094704864812
            ],
            [
              124.96767078185455,
              6.287919026954886
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288216705459226,
        "lng": 124.96790060210508
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96780630351478,
              6.288164450155199
            ],
            [
              124.96791004151001,
              6.288109253572411
            ],
            [
              124.96799490069539,
              6.288268960763253
            ],
            [
              124.96789116270014,
              6.288324157346041
            ],
            [
              124.96780630351478,
              6.288164450155199
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.2877939878259195,
        "lng": 124.967655522613
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9675803173394,
              6.287777666639832
            ],
            [
              124.96768405533464,
              6.2877224700570435
            ],
            [
              124.9677307278866,
              6.2878103090120065
            ],
            [
              124.96762698989136,
              6.287865505594795
            ],
            [
              124.9675803173394,
              6.287777666639832
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.28768219279233,
        "lng": 124.96759612118323
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96752091590965,
              6.287665871606243
            ],
            [
              124.96762465390488,
              6.287610675023454
            ],
            [
              124.96767132645684,
              6.287698513978417
            ],
            [
              124.96756758846159,
              6.287753710561206
            ],
            [
              124.96752091590965,
              6.287665871606243
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
        "status": "Main Campus Entrance Driveway",
        "source": "satellite imagery + evacuation plan",
        "verified": true,
        "lng": 124.96715469930116,
        "lat": 6.2878146337460965
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          124.96715469930116,
          6.2878146337460965
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "gate_exit",
        "name": "SCHOOL GATE (EXIT)",
        "type": "gate_exit",
        "status": "North Emergency Exit Gate",
        "source": "satellite imagery + evacuation plan",
        "verified": true,
        "lng": 124.96771819511567,
        "lat": 6.28868250582406
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          124.96771819511567,
          6.28868250582406
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
        "id": "p_north_gym",
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
            124.96732807749935,
            6.288603276050328
          ],
          [
            124.9674856501241,
            6.288437491790381
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_north_1",
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
            124.9674856501241,
            6.288437491790381
          ],
          [
            124.96768565234156,
            6.288351561125856
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_north_2",
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
            124.96768565234156,
            6.288351561125856
          ],
          [
            124.96782878349299,
            6.28825491847808
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
            124.9674856501241,
            6.288437491790381
          ],
          [
            124.9673315026904,
            6.288417080668733
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
            124.9673315026904,
            6.288417080668733
          ],
          [
            124.96724664350502,
            6.28825737347789
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
            124.96724664350502,
            6.28825737347789
          ],
          [
            124.96716178431964,
            6.288097666287048
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_4",
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
            124.96716178431964,
            6.288097666287048
          ],
          [
            124.96706843921574,
            6.287921988377121
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
            124.96706843921574,
            6.287921988377121
          ],
          [
            124.96718015705677,
            6.287862545903349
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
            124.96718015705677,
            6.287862545903349
          ],
          [
            124.96743309907643,
            6.287953305993601
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_3",
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
            124.96743309907643,
            6.287953305993601
          ],
          [
            124.96761663552955,
            6.287855650500974
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_1",
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
            124.96782878349299,
            6.28825491847808
          ],
          [
            124.96775241022615,
            6.288111182006322
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_2",
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
            124.96775241022615,
            6.288111182006322
          ],
          [
            124.96770149471493,
            6.288015357691816
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_3",
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
            124.96770149471493,
            6.288015357691816
          ],
          [
            124.96761663552955,
            6.287855650500974
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_4",
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
            124.96761663552955,
            6.287855650500974
          ],
          [
            124.96752329042565,
            6.2876799725910475
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gate_entrance_spur",
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
            124.96715469930116,
            6.2878146337460965
          ],
          [
            124.96718015705677,
            6.287862545903349
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gate_exit_spur",
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
            124.96771819511567,
            6.28868250582406
          ],
          [
            124.9674856501241,
            6.288437491790381
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_bcd_door_n",
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
            124.96730756315303,
            6.288429818341684
          ],
          [
            124.9673315026904,
            6.288417080668733
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_bcd_door_m",
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
            124.96722270396766,
            6.288270111150841
          ],
          [
            124.96724664350502,
            6.28825737347789
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_bcd_door_s",
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
            124.96713784478229,
            6.288110403959999
          ],
          [
            124.96716178431964,
            6.288097666287048
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
            124.96726805267863,
            6.288143552754599
          ],
          [
            124.96731048227133,
            6.288223406350021
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
            124.96734080637715,
            6.288627232128954
          ],
          [
            124.96732807749935,
            6.288603276050328
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_admin_door",
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
            124.96771745440651,
            6.288006865909849
          ],
          [
            124.96770149471493,
            6.288015357691816
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_shs_n_door",
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
            124.96749413604265,
            6.288453462509465
          ],
          [
            124.9674856501241,
            6.288437491790381
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_jhs_n_door",
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
            124.9676941382601,
            6.28836753184494
          ],
          [
            124.96768565234156,
            6.288351561125856
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
            124.96724664350502,
            6.28825737347789
          ],
          [
            124.96744170231318,
            6.288296988364756
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
            124.9674856501241,
            6.288437491790381
          ],
          [
            124.96760382959268,
            6.288313153595421
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
            124.96775241022615,
            6.288111182006322
          ],
          [
            124.9676810976868,
            6.288169611635244
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
            124.96743309907643,
            6.287953305993601
          ],
          [
            124.96751897040731,
            6.2881534464045785
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_w_c",
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
            124.96744170231318,
            6.288296988364756
          ],
          [
            124.9675614,
            6.2882333
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_n_c",
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
            124.96760382959268,
            6.288313153595421
          ],
          [
            124.9675614,
            6.2882333
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_e_c",
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
            124.9676810976868,
            6.288169611635244
          ],
          [
            124.9675614,
            6.2882333
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_s_c",
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
            124.96751897040731,
            6.2881534464045785
          ],
          [
            124.9675614,
            6.2882333
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
        "area_sqm": 18500,
        "source": "satellite imagery + cadastral alignment",
        "verified": true
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96723870391837,
              6.289070790194018
            ],
            [
              124.96835588232867,
              6.288476365456294
            ],
            [
              124.9677830828274,
              6.2873983419181085
            ],
            [
              124.9666659044171,
              6.287992766655833
            ],
            [
              124.96723870391837,
              6.289070790194018
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
            124.96722254984951,
            6.289233029496987
          ],
          [
            124.9665224615702,
            6.287915445172539
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
              124.96728926747498,
              6.28818347955231
            ],
            [
              124.9676723000728,
              6.28797967678509
            ],
            [
              124.967833532525,
              6.28828312044769
            ],
            [
              124.96745049992718,
              6.28848692321491
            ],
            [
              124.96728926747498,
              6.28818347955231
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
              124.96736260430532,
              6.28820591636366
            ],
            [
              124.96764987875369,
              6.288053064288245
            ],
            [
              124.96776019569467,
              6.28826068363634
            ],
            [
              124.9674729212463,
              6.288413535711755
            ],
            [
              124.96736260430532,
              6.28820591636366
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
        "source": "satellite imagery + evacuation plan",
        "verified": true,
        "lat": 6.288715071083917,
        "lng": 124.96738747892911
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96721312884455,
              6.288695166384694
            ],
            [
              124.96746848390976,
              6.288559297873214
            ],
            [
              124.96756182901368,
              6.288734975783141
            ],
            [
              124.96730647394845,
              6.288870844294621
            ],
            [
              124.96721312884455,
              6.288695166384694
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
        "lat": 6.288678065421495,
        "lng": 124.96757253360047
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96750293365666,
              6.288643397359619
            ],
            [
              124.96758273211454,
              6.288600938449782
            ],
            [
              124.9676421335443,
              6.288712733483371
            ],
            [
              124.96756233508643,
              6.288755192393209
            ],
            [
              124.96750293365666,
              6.288643397359619
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288501374666718,
        "lng": 124.96751959379826
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96741645906441,
              6.288499914099074
            ],
            [
              124.96757605598016,
              6.288414996279399
            ],
            [
              124.96762272853212,
              6.288502835234362
            ],
            [
              124.96746313161636,
              6.2885877530540375
            ],
            [
              124.96741645906441,
              6.288499914099074
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288415444002192,
        "lng": 124.9677195960157
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96760848143606,
              6.288418229325532
            ],
            [
              124.96778403804339,
              6.28832481972389
            ],
            [
              124.96783071059535,
              6.288412658678853
            ],
            [
              124.96765515398802,
              6.288506068280495
            ],
            [
              124.96760848143606,
              6.288418229325532
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
        "lat": 6.288299832387728,
        "lng": 124.96716684504715
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96701738798635,
              6.288143767409654
            ],
            [
              124.96712112598159,
              6.288088570826865
            ],
            [
              124.96731630210795,
              6.288455897365802
            ],
            [
              124.9672125641127,
              6.288511093948591
            ],
            [
              124.96701738798635,
              6.288143767409654
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
        "lat": 6.28811122229327,
        "lng": 124.96694379811963
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9668537424886,
              6.288066952348784
            ],
            [
              124.96695748048383,
              6.2880117557659965
            ],
            [
              124.96703385375066,
              6.288155492237754
            ],
            [
              124.96693011575543,
              6.288210688820543
            ],
            [
              124.9668537424886,
              6.288066952348784
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
        "source": "satellite imagery (mint green roof) + evacuation plan",
        "verified": true,
        "lat": 6.288063699159178,
        "lng": 124.96722562308595
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96713132449564,
              6.288011443855152
            ],
            [
              124.96723506249089,
              6.287956247272363
            ],
            [
              124.96731992167626,
              6.288115954463205
            ],
            [
              124.96721618368102,
              6.288171151045994
            ],
            [
              124.96713132449564,
              6.288011443855152
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288057622090073,
        "lng": 124.96746805489609
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96737128460113,
              6.288068139561743
            ],
            [
              124.9675308815169,
              6.287983221742068
            ],
            [
              124.96756482519103,
              6.288047104618404
            ],
            [
              124.96740522827528,
              6.288132022438079
            ],
            [
              124.96737128460113,
              6.288068139561743
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.28787345239818,
        "lng": 124.96739066948375
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96722955434974,
              6.287897720387651
            ],
            [
              124.96750086910653,
              6.287753360094203
            ],
            [
              124.96755178461775,
              6.287849184408708
            ],
            [
              124.96728046986097,
              6.2879935447021555
            ],
            [
              124.96722955434974,
              6.287897720387651
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.287977144672963,
        "lng": 124.96777331332702
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96767078185455,
              6.287919026954886
            ],
            [
              124.96778249969559,
              6.287859584481113
            ],
            [
              124.9678758447995,
              6.28803526239104
            ],
            [
              124.96776412695846,
              6.288094704864812
            ],
            [
              124.96767078185455,
              6.287919026954886
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.288216705459226,
        "lng": 124.96790060210508
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96780630351478,
              6.288164450155199
            ],
            [
              124.96791004151001,
              6.288109253572411
            ],
            [
              124.96799490069539,
              6.288268960763253
            ],
            [
              124.96789116270014,
              6.288324157346041
            ],
            [
              124.96780630351478,
              6.288164450155199
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.2877939878259195,
        "lng": 124.967655522613
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.9675803173394,
              6.287777666639832
            ],
            [
              124.96768405533464,
              6.2877224700570435
            ],
            [
              124.9677307278866,
              6.2878103090120065
            ],
            [
              124.96762698989136,
              6.287865505594795
            ],
            [
              124.9675803173394,
              6.287777666639832
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
        "source": "school evacuation plan + satellite alignment",
        "verified": true,
        "lat": 6.28768219279233,
        "lng": 124.96759612118323
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              124.96752091590965,
              6.287665871606243
            ],
            [
              124.96762465390488,
              6.287610675023454
            ],
            [
              124.96767132645684,
              6.287698513978417
            ],
            [
              124.96756758846159,
              6.287753710561206
            ],
            [
              124.96752091590965,
              6.287665871606243
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
        "status": "Main Campus Entrance Driveway",
        "source": "satellite imagery + evacuation plan",
        "verified": true,
        "lng": 124.96715469930116,
        "lat": 6.2878146337460965
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          124.96715469930116,
          6.2878146337460965
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "gate_exit",
        "name": "SCHOOL GATE (EXIT)",
        "type": "gate_exit",
        "status": "North Emergency Exit Gate",
        "source": "satellite imagery + evacuation plan",
        "verified": true,
        "lng": 124.96771819511567,
        "lat": 6.28868250582406
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          124.96771819511567,
          6.28868250582406
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_north_gym",
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
            124.96732807749935,
            6.288603276050328
          ],
          [
            124.9674856501241,
            6.288437491790381
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_north_1",
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
            124.9674856501241,
            6.288437491790381
          ],
          [
            124.96768565234156,
            6.288351561125856
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_north_2",
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
            124.96768565234156,
            6.288351561125856
          ],
          [
            124.96782878349299,
            6.28825491847808
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
            124.9674856501241,
            6.288437491790381
          ],
          [
            124.9673315026904,
            6.288417080668733
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
            124.9673315026904,
            6.288417080668733
          ],
          [
            124.96724664350502,
            6.28825737347789
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
            124.96724664350502,
            6.28825737347789
          ],
          [
            124.96716178431964,
            6.288097666287048
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_west_4",
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
            124.96716178431964,
            6.288097666287048
          ],
          [
            124.96706843921574,
            6.287921988377121
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
            124.96706843921574,
            6.287921988377121
          ],
          [
            124.96718015705677,
            6.287862545903349
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
            124.96718015705677,
            6.287862545903349
          ],
          [
            124.96743309907643,
            6.287953305993601
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_south_3",
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
            124.96743309907643,
            6.287953305993601
          ],
          [
            124.96761663552955,
            6.287855650500974
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_1",
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
            124.96782878349299,
            6.28825491847808
          ],
          [
            124.96775241022615,
            6.288111182006322
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_2",
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
            124.96775241022615,
            6.288111182006322
          ],
          [
            124.96770149471493,
            6.288015357691816
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_3",
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
            124.96770149471493,
            6.288015357691816
          ],
          [
            124.96761663552955,
            6.287855650500974
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_east_4",
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
            124.96761663552955,
            6.287855650500974
          ],
          [
            124.96752329042565,
            6.2876799725910475
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gate_entrance_spur",
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
            124.96715469930116,
            6.2878146337460965
          ],
          [
            124.96718015705677,
            6.287862545903349
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_gate_exit_spur",
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
            124.96771819511567,
            6.28868250582406
          ],
          [
            124.9674856501241,
            6.288437491790381
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_bcd_door_n",
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
            124.96730756315303,
            6.288429818341684
          ],
          [
            124.9673315026904,
            6.288417080668733
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_bcd_door_m",
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
            124.96722270396766,
            6.288270111150841
          ],
          [
            124.96724664350502,
            6.28825737347789
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_bcd_door_s",
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
            124.96713784478229,
            6.288110403959999
          ],
          [
            124.96716178431964,
            6.288097666287048
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
            124.96726805267863,
            6.288143552754599
          ],
          [
            124.96731048227133,
            6.288223406350021
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
            124.96734080637715,
            6.288627232128954
          ],
          [
            124.96732807749935,
            6.288603276050328
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_admin_door",
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
            124.96771745440651,
            6.288006865909849
          ],
          [
            124.96770149471493,
            6.288015357691816
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_shs_n_door",
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
            124.96749413604265,
            6.288453462509465
          ],
          [
            124.9674856501241,
            6.288437491790381
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_jhs_n_door",
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
            124.9676941382601,
            6.28836753184494
          ],
          [
            124.96768565234156,
            6.288351561125856
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
            124.96724664350502,
            6.28825737347789
          ],
          [
            124.96744170231318,
            6.288296988364756
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
            124.9674856501241,
            6.288437491790381
          ],
          [
            124.96760382959268,
            6.288313153595421
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
            124.96775241022615,
            6.288111182006322
          ],
          [
            124.9676810976868,
            6.288169611635244
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
            124.96743309907643,
            6.287953305993601
          ],
          [
            124.96751897040731,
            6.2881534464045785
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_w_c",
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
            124.96744170231318,
            6.288296988364756
          ],
          [
            124.9675614,
            6.2882333
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_n_c",
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
            124.96760382959268,
            6.288313153595421
          ],
          [
            124.9675614,
            6.2882333
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_e_c",
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
            124.9676810976868,
            6.288169611635244
          ],
          [
            124.9675614,
            6.2882333
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "p_oval_s_c",
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
            124.96751897040731,
            6.2881534464045785
          ],
          [
            124.9675614,
            6.2882333
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
    "lat": 6.2882333,
    "lng": 124.9675614
  },
  "plusCode": "6QR67XQ9+43",
  "calibrationDatum": {
    "rotationDeg": -28,
    "metersPerDegreeLat": 110570.8,
    "metersPerDegreeLng": 110647.2
  },
  "layerCounts": {
    "buildings": 13,
    "pathways": 32,
    "gates": 2,
    "evacuationAreas": 2
  }
};
