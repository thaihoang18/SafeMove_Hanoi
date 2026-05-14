import fs from 'fs';
import https from 'https';

const plantUMLDiagram = `@startuml SafeMove_HaNoi_ERD
!define ENTITY(x) package x

entity USERS {
  *id : uuid <<PK>>
  --
  email : citext <<UK>>
  password_hash : text
  full_name : text
  birth_year : int
  home_lat : double
  home_lng : double
}

entity USER_PROFILES {
  *user_id : uuid <<PK, FK>>
  --
  alert_threshold : smallint
  default_max_route_ratio : numeric
  primary_activity_id : uuid <<FK>>
  mask_preference : text
}

entity USER_CONDITIONS {
  *user_id : uuid <<PK, FK>>
  *condition_id : uuid <<PK, FK>>
  --
  severity : smallint
}

entity USER_ACTIVITIES {
  *user_id : uuid <<PK, FK>>
  *activity_id : uuid <<PK, FK>>
  --
  frequency_per_week : smallint
  is_primary : boolean
}

entity HEALTH_CONDITIONS {
  *id : uuid <<PK>>
  --
  slug : text <<UK>>
  name : text <<UK>>
  description : text
}

entity ACTIVITIES {
  *id : uuid <<PK>>
  --
  slug : text <<UK>>
  name : text <<UK>>
  description : text
}

entity LOCATIONS {
  *id : uuid <<PK>>
  --
  name : text
  location_type : text
  city : text
  address : text
  lat : double
  lng : double
}

entity AQI_MEASUREMENTS {
  *id : bigserial <<PK>>
  --
  location_id : uuid <<FK>>
  measured_at : timestamp
  aqi : smallint
  pm25 : numeric
  pm10 : numeric
}

entity ROUTE_REQUESTS {
  *id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  origin_label : text
  origin_lat : double
  origin_lng : double
  destination_label : text
  destination_lat : double
  destination_lng : double
  max_ratio : numeric
  status : text
}

entity ROUTE_OPTIONS {
  *id : uuid <<PK>>
  --
  request_id : uuid <<FK>>
  option_rank : smallint
  route_name : text
  distance_m : int
  duration_s : int
  avg_aqi : numeric
  exposure_score : numeric
  is_recommended : boolean
}

entity INDOOR_PLACES {
  *id : uuid <<PK>>
  --
  name : text
  city : text
  lat : double
  lng : double
  aqi_controlled : boolean
  has_hepa : boolean
}

entity INDOOR_PLACE_AQI {
  *id : bigserial <<PK>>
  --
  place_id : uuid <<FK>>
  aqi : smallint
}

entity ADVICE_RULES {
  *id : uuid <<PK>>
  --
  name : text
  condition_id : uuid <<FK>>
  activity_id : uuid <<FK>>
  aqi_min : smallint
  aqi_max : smallint
  severity : text
  title : text
  body : text
}

entity ADVICE_EVENTS {
  *id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  rule_id : uuid <<FK>>
  location_id : uuid <<FK>>
  activity_id : uuid <<FK>>
  severity : text
  title : text
  body : text
}

entity NOTIFICATIONS {
  *id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  type : text
  title : text
  description : text
  is_read : boolean
  is_pinned : boolean
  related_route_request_id : uuid <<FK>>
  related_advice_event_id : uuid <<FK>>
}

entity NOTIFICATION_PREFERENCES {
  *user_id : uuid <<PK, FK>>
  --
  alert_enabled : boolean
  tip_enabled : boolean
  route_enabled : boolean
  push_enabled : boolean
  email_enabled : boolean
}

USERS ||--o{ USER_PROFILES : has
USERS ||--o{ USER_CONDITIONS : has
USERS ||--o{ USER_ACTIVITIES : has
USERS ||--o{ ROUTE_REQUESTS : creates
USERS ||--o{ ADVICE_EVENTS : receives
USERS ||--o{ NOTIFICATIONS : receives
USERS ||--o{ NOTIFICATION_PREFERENCES : has

HEALTH_CONDITIONS ||--o{ USER_CONDITIONS : linked_to
HEALTH_CONDITIONS ||--o{ ADVICE_RULES : triggers

ACTIVITIES ||--o{ USER_ACTIVITIES : linked_to
ACTIVITIES ||--o{ ADVICE_RULES : targets
ACTIVITIES ||--o{ ADVICE_EVENTS : related_to
ACTIVITIES ||--o{ USER_PROFILES : primary

LOCATIONS ||--o{ AQI_MEASUREMENTS : has
LOCATIONS ||--o{ ADVICE_EVENTS : measured_at

AQI_MEASUREMENTS ||--o{ ADVICE_EVENTS : triggers

ROUTE_REQUESTS ||--o{ ROUTE_OPTIONS : contains
ROUTE_REQUESTS ||--o{ NOTIFICATIONS : related_to

INDOOR_PLACES ||--o{ INDOOR_PLACE_AQI : has

ADVICE_RULES ||--o{ ADVICE_EVENTS : generates
ADVICE_RULES ||--o{ NOTIFICATIONS : creates

ADVICE_EVENTS ||--o{ NOTIFICATIONS : related_to

@enduml`;

const payload = JSON.stringify({
  diagram_source: plantUMLDiagram
});

const options = {
  hostname: 'kroki.io',
  port: 443,
  path: '/plantuml/png',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  const fileStream = fs.createWriteStream('./db/ERD-SafeMove-HaNoi.png');
  res.pipe(fileStream);
  
  fileStream.on('finish', () => {
    fileStream.close();
    const stats = fs.statSync('./db/ERD-SafeMove-HaNoi.png');
    console.log('✓ ERD PNG saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
  });
  
  fileStream.on('error', (err) => {
    fs.unlink('./db/ERD-SafeMove-HaNoi.png', () => {});
    console.error('Error saving file:', err);
  });
});

req.on('error', (err) => {
  console.error('Network error:', err);
});

req.write(payload);
req.end();
