import fs from 'fs';
import https from 'https';

const plantUMLDiagram = `@startuml SafeMove_HaNoi_Chen_ERD

' Entity definitions with attributes shown inside
entity "User" as user {
  *<u>id</u>
  --
  email
  password_hash
  full_name
  birth_year
  home_lat
  home_lng
}

entity "UserProfile" as profile {
  *<u>user_id</u> FK
  --
  alert_threshold
  default_max_route_ratio
  primary_activity_id FK
}

entity "HealthCondition" as health {
  *<u>id</u>
  --
  slug
  name
  description
}

entity "Activity" as activity {
  *<u>id</u>
  --
  slug
  name
  description
}

entity "Location" as location {
  *<u>id</u>
  --
  name
  location_type
  city
  district
  address
  lat
  lng
}

entity "AQIMeasurement" as aqi {
  *<u>id</u>
  --
  location_id FK
  measured_at
  aqi
  pm25
  pm10
}

entity "RouteRequest" as route_req {
  *<u>id</u>
  --
  user_id FK
  origin_label
  origin_lat
  origin_lng
  destination_label
  destination_lat
  destination_lng
  max_ratio
  status
}

entity "RouteOption" as route_opt {
  *<u>id</u>
  --
  request_id FK
  option_rank
  route_name
  distance_m
  duration_s
  avg_aqi
  exposure_score
  is_recommended
}

entity "IndoorPlace" as indoor {
  *<u>id</u>
  --
  name
  city
  district
  address
  lat
  lng
  aqi_controlled
  has_hepa
}

entity "IndoorPlaceAQI" as indoor_aqi {
  *<u>id</u>
  --
  place_id FK
  measured_at
  aqi
}

entity "AdviceRule" as advice_rule {
  *<u>id</u>
  --
  name
  condition_id FK
  activity_id FK
  aqi_min
  aqi_max
  severity
  title
  body
}

entity "AdviceEvent" as advice_event {
  *<u>id</u>
  --
  user_id FK
  rule_id FK
  location_id FK
  aqi_measurement_id FK
  activity_id FK
  severity
  title
  body
}

entity "Notification" as notif {
  *<u>id</u>
  --
  user_id FK
  type
  title
  description
  is_read
  is_pinned
  related_route_request_id FK
  related_advice_event_id FK
}

entity "NotificationPref" as notif_pref {
  *<u>user_id</u> FK
  --
  alert_enabled
  tip_enabled
  route_enabled
  social_enabled
  system_enabled
  push_enabled
  email_enabled
}

' Relationships: 1 to 1, 1 to M
user ||--o| profile : "1:1 has"
user ||--o{ health : "1:M has"
user ||--o{ activity : "1:M has"
user ||--o{ route_req : "1:M creates"
user ||--o{ advice_event : "1:M receives"
user ||--o{ notif : "1:M receives"
user ||--o| notif_pref : "1:1 has"

location ||--o{ aqi : "1:M measures"
route_req ||--o{ route_opt : "1:M contains"
advice_rule ||--o{ advice_event : "1:M generates"
indoor ||--o{ indoor_aqi : "1:M has"

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
    console.log('✓ ERD (Chen Standard) saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
    console.log('');
    console.log('📊 Sơ đồ thực thể liên kết (ERD) - Chen Standard:');
    console.log('  ✓ Thực thể: Danh từ số ít');
    console.log('  ✓ Thuộc tính: Liệt kê bên trong');
    console.log('  ✓ Mối quan hệ: Crow Foot notation');
    console.log('  ✓ Khóa chính (PK): <u>Gạch chân</u>');
    console.log('  ✓ Khóa ngoại (FK): [FK]');
    console.log('  ✓ Cardinality: 1, M được thể hiện rõ');
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
