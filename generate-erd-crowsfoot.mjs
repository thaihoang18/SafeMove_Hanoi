import fs from 'fs';
import https from 'https';

const plantUMLDiagram = `@startuml SafeMove_HaNoi_Standard_ERD

!define PRIMARY_KEY(x) <u>x</u>
!define FOREIGN_KEY(x) <i>x</i>

entity "User" as user {
  *PRIMARY_KEY(id): UUID
  --
  email: citext
  password_hash: text
  full_name: text
  birth_year: int
  home_lat: double
  home_lng: double
}

entity "UserProfile" as profile {
  *PRIMARY_KEY(user_id): UUID [FK]
  --
  alert_threshold: smallint
  default_max_route_ratio: numeric
  primary_activity_id: UUID [FK]
}

entity "HealthCondition" as health {
  *PRIMARY_KEY(id): UUID
  --
  slug: text [UK]
  name: text [UK]
  description: text
}

entity "Activity" as activity {
  *PRIMARY_KEY(id): UUID
  --
  slug: text [UK]
  name: text [UK]
  description: text
}

entity "Location" as location {
  *PRIMARY_KEY(id): UUID
  --
  name: text
  location_type: text
  city: text
  address: text
  lat: double
  lng: double
}

entity "AQIMeasurement" as aqi {
  *PRIMARY_KEY(id): bigserial
  --
  location_id: UUID [FK]
  measured_at: timestamp
  aqi: smallint
  pm25: numeric
  pm10: numeric
}

entity "RouteRequest" as route_req {
  *PRIMARY_KEY(id): UUID
  --
  user_id: UUID [FK]
  origin_label: text
  origin_lat: double
  origin_lng: double
  destination_label: text
  destination_lat: double
  destination_lng: double
  max_ratio: numeric
  status: text
}

entity "RouteOption" as route_opt {
  *PRIMARY_KEY(id): UUID
  --
  request_id: UUID [FK]
  option_rank: smallint
  route_name: text
  distance_m: int
  duration_s: int
  avg_aqi: numeric
  exposure_score: numeric
  is_recommended: boolean
}

entity "IndoorPlace" as indoor {
  *PRIMARY_KEY(id): UUID
  --
  name: text
  city: text
  lat: double
  lng: double
  aqi_controlled: boolean
  has_hepa: boolean
}

entity "IndoorPlaceAQI" as indoor_aqi {
  *PRIMARY_KEY(id): bigserial
  --
  place_id: UUID [FK]
  aqi: smallint
}

entity "AdviceRule" as advice_rule {
  *PRIMARY_KEY(id): UUID
  --
  name: text
  condition_id: UUID [FK]
  activity_id: UUID [FK]
  aqi_min: smallint
  aqi_max: smallint
  severity: text
  title: text
  body: text
}

entity "AdviceEvent" as advice_event {
  *PRIMARY_KEY(id): UUID
  --
  user_id: UUID [FK]
  rule_id: UUID [FK]
  location_id: UUID [FK]
  activity_id: UUID [FK]
  severity: text
  title: text
  body: text
}

entity "Notification" as notif {
  *PRIMARY_KEY(id): UUID
  --
  user_id: UUID [FK]
  type: text
  title: text
  description: text
  is_read: boolean
  is_pinned: boolean
}

entity "NotificationPreference" as notif_pref {
  *PRIMARY_KEY(user_id): UUID [FK]
  --
  alert_enabled: boolean
  tip_enabled: boolean
  route_enabled: boolean
  push_enabled: boolean
  email_enabled: boolean
}

' Relationships: 1:1, 1:N
user ||--o| profile : "1:1"
user ||--o{ health : "1:N"
user ||--o{ activity : "1:N"
user ||--o{ route_req : "1:N"
user ||--o{ advice_event : "1:N"
user ||--o{ notif : "1:N"
user ||--o| notif_pref : "1:1"

location ||--o{ aqi : "1:N"
route_req ||--o{ route_opt : "1:N"
advice_rule ||--o{ advice_event : "1:N"
indoor ||--o{ indoor_aqi : "1:N"

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
    console.log('✓ ERD (chuẩn Chen/Crow\'s Foot) saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
    console.log('');
    console.log('📊 Sơ đồ thực thể liên kết (ERD):');
    console.log('  ✓ Thực thể (Entity): danh từ số ít');
    console.log('  ✓ Thuộc tính (Attribute): liệt kê bên trong');
    console.log('  ✓ Mối quan hệ (Relationship): Crow Foot notation');
    console.log('  ✓ Cardinality: 1:1, 1:N được thể hiện rõ');
    console.log('  ✓ Khóa chính (PK): gạch chân');
    console.log('  ✓ Khóa ngoại (FK): [FK]');
    console.log('  ✓ Khóa duy nhất (UK): [UK]');
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
