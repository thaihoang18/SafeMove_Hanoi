import fs from 'fs';
import https from 'https';

const plantUMLDiagram = `@startuml SafeMove_HaNoi_ERD
!define TABLENAME(name) class name << (T,#FFAAAA) >>
!define PRIMARY_KEY(x) <u>x</u>
!define FOREIGN_KEY(x) <i>x</i>

entity USERS {
  * PRIMARY_KEY(id): uuid
  --
  * email: citext [UK]
  * password_hash: text
  full_name: text
  birth_year: int
  home_lat: double
  home_lng: double
  created_at: timestamptz
  updated_at: timestamptz
}

entity USER_PROFILES {
  * PRIMARY_KEY(user_id): uuid [FK]
  --
  alert_threshold: smallint
  default_max_route_ratio: numeric
  primary_activity_id: uuid [FK]
  mask_preference: text
  created_at: timestamptz
  updated_at: timestamptz
}

entity USER_CONDITIONS {
  * PRIMARY_KEY(user_id): uuid [FK]
  * PRIMARY_KEY(condition_id): uuid [FK]
  --
  severity: smallint
  noted_at: timestamptz
}

entity USER_ACTIVITIES {
  * PRIMARY_KEY(user_id): uuid [FK]
  * PRIMARY_KEY(activity_id): uuid [FK]
  --
  frequency_per_week: smallint
  is_primary: boolean
  created_at: timestamptz
}

entity HEALTH_CONDITIONS {
  * PRIMARY_KEY(id): uuid
  --
  * slug: text [UK]
  * name: text [UK]
  description: text
  created_at: timestamptz
}

entity ACTIVITIES {
  * PRIMARY_KEY(id): uuid
  --
  * slug: text [UK]
  * name: text [UK]
  description: text
  created_at: timestamptz
}

entity LOCATIONS {
  * PRIMARY_KEY(id): uuid
  --
  * name: text
  * location_type: text
  city: text
  district: text
  address: text
  lat: double
  lng: double
  created_at: timestamptz
}

entity AQI_MEASUREMENTS {
  * PRIMARY_KEY(id): bigserial
  --
  * location_id: uuid [FK]
  * measured_at: timestamptz
  * aqi: smallint
  pm25: numeric
  pm10: numeric
  no2: numeric
  o3: numeric
  co: numeric
  so2: numeric
  source: text
  created_at: timestamptz
}

entity ROUTE_REQUESTS {
  * PRIMARY_KEY(id): uuid
  --
  * user_id: uuid [FK]
  * origin_label: text
  * origin_lat: double
  * origin_lng: double
  * destination_label: text
  * destination_lat: double
  * destination_lng: double
  max_ratio: numeric
  shortest_distance_m: int
  shortest_duration_s: int
  status: request_status
  requested_at: timestamptz
  finished_at: timestamptz
}

entity ROUTE_OPTIONS {
  * PRIMARY_KEY(id): uuid
  --
  * request_id: uuid [FK]
  * option_rank: smallint
  route_name: text
  distance_m: int
  duration_s: int
  avg_aqi: numeric
  exposure_score: numeric
  exposure: exposure_level
  is_recommended: boolean
  is_within_ratio: boolean
  aqi_saving_percent: numeric
  polyline: text
  created_at: timestamptz
}

entity INDOOR_PLACES {
  * PRIMARY_KEY(id): uuid
  --
  * name: text
  city: text
  district: text
  address: text
  lat: double
  lng: double
  aqi_controlled: boolean
  has_hepa: boolean
  place_type: text
  created_at: timestamptz
}

entity INDOOR_PLACE_AQI {
  * PRIMARY_KEY(id): bigserial
  --
  * place_id: uuid [FK]
  * measured_at: timestamptz
  * aqi: smallint
  source: text
}

entity ADVICE_RULES {
  * PRIMARY_KEY(id): uuid
  --
  * name: text
  condition_id: uuid [FK]
  activity_id: uuid [FK]
  aqi_min: smallint
  aqi_max: smallint
  severity: advice_severity
  title: text
  body: text
  is_active: boolean
  priority: smallint
  created_at: timestamptz
  updated_at: timestamptz
}

entity ADVICE_EVENTS {
  * PRIMARY_KEY(id): uuid
  --
  * user_id: uuid [FK]
  rule_id: uuid [FK]
  location_id: uuid [FK]
  aqi_measurement_id: bigint [FK]
  activity_id: uuid [FK]
  severity: advice_severity
  title: text
  body: text
  event_time: timestamptz
  is_read: boolean
  channel: text
  metadata: jsonb
  created_at: timestamptz
}

entity NOTIFICATIONS {
  * PRIMARY_KEY(id): uuid
  --
  * user_id: uuid [FK]
  * type: notification_type
  * title: text
  * description: text
  is_read: boolean
  is_pinned: boolean
  related_route_request_id: uuid [FK]
  related_advice_event_id: uuid [FK]
  created_at: timestamptz
  read_at: timestamptz
}

entity NOTIFICATION_PREFERENCES {
  * PRIMARY_KEY(user_id): uuid [FK]
  --
  alert_enabled: boolean
  tip_enabled: boolean
  route_enabled: boolean
  social_enabled: boolean
  system_enabled: boolean
  push_enabled: boolean
  email_enabled: boolean
  daily_tip_time: time
  weekly_report_enabled: boolean
  created_at: timestamptz
  updated_at: timestamptz
}

USERS ||--o{ USER_PROFILES : has
USERS ||--o{ USER_CONDITIONS : has
USERS ||--o{ USER_ACTIVITIES : has
USERS ||--o{ ROUTE_REQUESTS : creates
USERS ||--o{ ADVICE_EVENTS : receives
USERS ||--o{ NOTIFICATIONS : receives
USERS ||--o{ NOTIFICATION_PREFERENCES : has

HEALTH_CONDITIONS ||--o{ USER_CONDITIONS : linked
HEALTH_CONDITIONS ||--o{ ADVICE_RULES : triggers

ACTIVITIES ||--o{ USER_ACTIVITIES : linked
ACTIVITIES ||--o{ USER_PROFILES : primary
ACTIVITIES ||--o{ ADVICE_RULES : targets
ACTIVITIES ||--o{ ADVICE_EVENTS : related

LOCATIONS ||--o{ AQI_MEASUREMENTS : has
LOCATIONS ||--o{ ADVICE_EVENTS : measured

AQI_MEASUREMENTS ||--o{ ADVICE_EVENTS : triggers

ROUTE_REQUESTS ||--o{ ROUTE_OPTIONS : contains
ROUTE_REQUESTS ||--o{ NOTIFICATIONS : related

INDOOR_PLACES ||--o{ INDOOR_PLACE_AQI : has

ADVICE_RULES ||--o{ ADVICE_EVENTS : generates
ADVICE_RULES ||--o{ NOTIFICATIONS : creates

ADVICE_EVENTS ||--o{ NOTIFICATIONS : related

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
    console.log('✓ PNG saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
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
