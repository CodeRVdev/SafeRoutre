export interface CampusViewpoint {
  id: string;
  name: string;
  shortName: string;
  category: 'Entrance' | 'Evacuation Ground' | 'Sports Facility' | 'Academic Wing' | 'Health Services' | 'Administration';
  lat: number;
  lng: number;
  image: string;
  hasRealPhoto: boolean;
  yaw?: number;
  pitch?: number;
  connectedViewpoints: string[];
  description: string;
}

export const CAMPUS_VIEWPOINTS: CampusViewpoint[] = [
  {
    id: 'gate-entrance',
    name: 'School Gate (Main Entrance)',
    shortName: 'Main Gate',
    category: 'Entrance',
    lat: 6.28784,
    lng: 124.96728,
    image: '/360/gate-entrance.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['school-ground', 'bcd-building', 'school-clinic'],
    description: 'Main campus vehicular and pedestrian entrance off the barangay access road.'
  },
  {
    id: 'school-ground',
    name: 'School Ground (Central Evacuation Oval)',
    shortName: 'Evacuation Oval',
    category: 'Evacuation Ground',
    lat: 6.2882333,
    lng: 124.9675614,
    image: '/360/school-ground.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['gate-entrance', 'school-gym', 'bcd-building', 'school-clinic', 'admin-building', 'shs-north'],
    description: 'Central open field designated as the Primary Earthquake & Fire Evacuation Assembly Zone.'
  },
  {
    id: 'school-gym',
    name: 'School GYM (Covered Court)',
    shortName: 'School Gym',
    category: 'Sports Facility',
    lat: 6.28862,
    lng: 124.96715,
    image: '/360/school-gym.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['school-ground', 'shs-north', 'gate-exit'],
    description: 'Large covered court facility used for school assemblies, sports, and temporary emergency staging.'
  },
  {
    id: 'bcd-building',
    name: 'BCD Building (School ID 304561)',
    shortName: 'BCD Building',
    category: 'Academic Wing',
    lat: 6.28812,
    lng: 124.96708,
    image: '/360/bcd-building.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['gate-entrance', 'school-ground', 'school-clinic'],
    description: '2-storey Senior High and Tech-Voc academic building along the western perimeter.'
  },
  {
    id: 'school-clinic',
    name: 'School Clinic (First Aid Services)',
    shortName: 'School Clinic',
    category: 'Health Services',
    lat: 6.28795,
    lng: 124.96722,
    image: '/360/school-clinic.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['gate-entrance', 'bcd-building', 'school-ground'],
    description: 'Health inspection, first aid treatment, and emergency triage station.'
  },
  {
    id: 'admin-building',
    name: 'ADMIN Building (Principal & Faculty)',
    shortName: 'Admin Building',
    category: 'Administration',
    lat: 6.28815,
    lng: 124.96792,
    image: '/360/admin-building.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['school-ground', 'shs-north'],
    description: 'School principal office, administrative staff, registrar, and teacher faculty rooms.'
  },
  {
    id: 'shs-north',
    name: 'SHS Building (North Wing)',
    shortName: 'SHS North',
    category: 'Academic Wing',
    lat: 6.28850,
    lng: 124.96738,
    image: '/360/shs-north.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['school-ground', 'school-gym', 'gate-exit'],
    description: 'Senior high classroom wing situated on the north side of the campus quadrangle.'
  },
  {
    id: 'gate-exit',
    name: 'School Gate (North Emergency Exit)',
    shortName: 'Exit Gate',
    category: 'Entrance',
    lat: 6.28875,
    lng: 124.96748,
    image: '/360/gate-exit.jpg',
    hasRealPhoto: false,
    connectedViewpoints: ['school-gym', 'shs-north'],
    description: 'Secondary emergency evacuation egress gate leading north to the barangay thoroughfare.'
  }
];
