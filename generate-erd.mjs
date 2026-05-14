import fs from 'fs';
import https from 'https';

const mermaidMarkup = `erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ USER_CONDITIONS : has
    USERS ||--o{ USER_ACTIVITIES : has
    USERS ||--o{ ROUTE_REQUESTS : creates
    USERS ||--o{ ADVICE_EVENTS : receives
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ NOTIFICATION_PREFERENCES : has
    
    HEALTH_CONDITIONS ||--o{ USER_CONDITIONS : "linked to"
    HEALTH_CONDITIONS ||--o{ ADVICE_RULES : triggers
    
    ACTIVITIES ||--o{ USER_ACTIVITIES : "linked to"
    ACTIVITIES ||--o{ ADVICE_RULES : targets
    ACTIVITIES ||--o{ ADVICE_EVENTS : "related to"
    ACTIVITIES ||--o{ USER_PROFILES : primary
    
    LOCATIONS ||--o{ AQI_MEASUREMENTS : has
    LOCATIONS ||--o{ ADVICE_EVENTS : "measured at"
    
    AQI_MEASUREMENTS ||--o{ ADVICE_EVENTS : triggers
    
    ROUTE_REQUESTS ||--o{ ROUTE_OPTIONS : contains
    ROUTE_REQUESTS ||--o{ NOTIFICATIONS : "related to"
    
    ROUTE_OPTIONS ||--o{ ROUTE_REQUESTS : "belongs to"
    
    INDOOR_PLACES ||--o{ INDOOR_PLACE_AQI : has
    
    ADVICE_RULES ||--o{ ADVICE_EVENTS : generates
    ADVICE_RULES ||--o{ NOTIFICATIONS : creates
    
    ADVICE_EVENTS ||--o{ NOTIFICATIONS : "related to"
    
    USERS : uuid id PK
    USERS : citext email UK
    USERS : text password_hash
    USERS : text full_name
    USERS : int birth_year
    USERS : double home_lat
    USERS : double home_lng
    
    USER_PROFILES : uuid user_id PK,FK
    USER_PROFILES : smallint alert_threshold
    USER_PROFILES : numeric default_max_route_ratio
    USER_PROFILES : uuid primary_activity_id FK
    USER_PROFILES : text mask_preference
    
    USER_CONDITIONS : uuid user_id PK,FK
    USER_CONDITIONS : uuid condition_id PK,FK
    USER_CONDITIONS : smallint severity
    
    USER_ACTIVITIES : uuid user_id PK,FK
    USER_ACTIVITIES : uuid activity_id PK,FK
    USER_ACTIVITIES : smallint frequency_per_week
    USER_ACTIVITIES : boolean is_primary
    
    HEALTH_CONDITIONS : uuid id PK
    HEALTH_CONDITIONS : text slug UK
    HEALTH_CONDITIONS : text name UK
    HEALTH_CONDITIONS : text description
    
    ACTIVITIES : uuid id PK
    ACTIVITIES : text slug UK
    ACTIVITIES : text name UK
    ACTIVITIES : text description
    
    LOCATIONS : uuid id PK
    LOCATIONS : text name
    LOCATIONS : text location_type
    LOCATIONS : text city
    LOCATIONS : text district
    LOCATIONS : text address
    LOCATIONS : double lat
    LOCATIONS : double lng
    
    AQI_MEASUREMENTS : bigserial id PK
    AQI_MEASUREMENTS : uuid location_id FK
    AQI_MEASUREMENTS : timestamptz measured_at
    AQI_MEASUREMENTS : smallint aqi
    AQI_MEASUREMENTS : numeric pm25
    AQI_MEASUREMENTS : numeric pm10
    
    ROUTE_REQUESTS : uuid id PK
    ROUTE_REQUESTS : uuid user_id FK
    ROUTE_REQUESTS : text origin_label
    ROUTE_REQUESTS : double origin_lat
    ROUTE_REQUESTS : double origin_lng
    ROUTE_REQUESTS : text destination_label
    ROUTE_REQUESTS : double destination_lat
    ROUTE_REQUESTS : double destination_lng
    ROUTE_REQUESTS : numeric max_ratio
    ROUTE_REQUESTS : request_status status
    
    ROUTE_OPTIONS : uuid id PK
    ROUTE_OPTIONS : uuid request_id FK
    ROUTE_OPTIONS : smallint option_rank
    ROUTE_OPTIONS : text route_name
    ROUTE_OPTIONS : int distance_m
    ROUTE_OPTIONS : int duration_s
    ROUTE_OPTIONS : numeric avg_aqi
    ROUTE_OPTIONS : numeric exposure_score
    ROUTE_OPTIONS : exposure_level exposure
    ROUTE_OPTIONS : boolean is_recommended
    
    INDOOR_PLACES : uuid id PK
    INDOOR_PLACES : text name
    INDOOR_PLACES : text city
    INDOOR_PLACES : double lat
    INDOOR_PLACES : double lng
    INDOOR_PLACES : boolean aqi_controlled
    INDOOR_PLACES : boolean has_hepa
    
    INDOOR_PLACE_AQI : bigserial id PK
    INDOOR_PLACE_AQI : uuid place_id FK
    INDOOR_PLACE_AQI : smallint aqi
    
    ADVICE_RULES : uuid id PK
    ADVICE_RULES : text name
    ADVICE_RULES : uuid condition_id FK
    ADVICE_RULES : uuid activity_id FK
    ADVICE_RULES : smallint aqi_min
    ADVICE_RULES : smallint aqi_max
    ADVICE_RULES : advice_severity severity
    ADVICE_RULES : text title
    ADVICE_RULES : text body
    
    ADVICE_EVENTS : uuid id PK
    ADVICE_EVENTS : uuid user_id FK
    ADVICE_EVENTS : uuid rule_id FK
    ADVICE_EVENTS : uuid location_id FK
    ADVICE_EVENTS : bigint aqi_measurement_id FK
    ADVICE_EVENTS : uuid activity_id FK
    ADVICE_EVENTS : advice_severity severity
    ADVICE_EVENTS : text title
    ADVICE_EVENTS : text body
    
    NOTIFICATIONS : uuid id PK
    NOTIFICATIONS : uuid user_id FK
    NOTIFICATIONS : notification_type type
    NOTIFICATIONS : text title
    NOTIFICATIONS : text description
    NOTIFICATIONS : boolean is_read
    NOTIFICATIONS : boolean is_pinned
    NOTIFICATIONS : uuid related_route_request_id FK
    NOTIFICATIONS : uuid related_advice_event_id FK
    
    NOTIFICATION_PREFERENCES : uuid user_id PK,FK
    NOTIFICATION_PREFERENCES : boolean alert_enabled
    NOTIFICATION_PREFERENCES : boolean tip_enabled
    NOTIFICATION_PREFERENCES : boolean route_enabled
    NOTIFICATION_PREFERENCES : boolean push_enabled
    NOTIFICATION_PREFERENCES : boolean email_enabled`;

// Use POST request to avoid URI length limit
const payload = JSON.stringify({
  diagram_source: mermaidMarkup
});

const options = {
  hostname: 'kroki.io',
  port: 443,
  path: '/mermaid/png',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  const fileStream = fs.createWriteStream('./db/ERD-SafeMove-HaNoi.png');
  res.pipe(fileStream);
  
  fileStream.on('finish', () => {
    fileStream.close();
    console.log('✓ PNG saved: ./db/ERD-SafeMove-HaNoi.png');
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
