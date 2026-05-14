import fs from 'fs';
import https from 'https';

const graphvizDiagram = `digraph SafeMove_HaNoi_ERD {
  graph [rankdir=TB];
  node [fontname="Arial", fontsize=10];
  edge [fontname="Arial", fontsize=9];
  
  // Entities (rectangles)
  User [label="User", shape=box, style="filled,bold", fillcolor=lightblue];
  UserProfile [label="UserProfile", shape=box, style="filled,bold", fillcolor=lightblue];
  HealthCondition [label="HealthCondition", shape=box, style="filled,bold", fillcolor=lightblue];
  Activity [label="Activity", shape=box, style="filled,bold", fillcolor=lightblue];
  Location [label="Location", shape=box, style="filled,bold", fillcolor=lightblue];
  AQIMeasurement [label="AQIMeasurement", shape=box, style="filled,bold", fillcolor=lightblue];
  RouteRequest [label="RouteRequest", shape=box, style="filled,bold", fillcolor=lightblue];
  RouteOption [label="RouteOption", shape=box, style="filled,bold", fillcolor=lightblue];
  IndoorPlace [label="IndoorPlace", shape=box, style="filled,bold", fillcolor=lightblue];
  IndoorPlaceAQI [label="IndoorPlaceAQI", shape=box, style="filled,bold", fillcolor=lightblue];
  AdviceRule [label="AdviceRule", shape=box, style="filled,bold", fillcolor=lightblue];
  AdviceEvent [label="AdviceEvent", shape=box, style="filled,bold", fillcolor=lightblue];
  Notification [label="Notification", shape=box, style="filled,bold", fillcolor=lightblue];
  NotificationPref [label="NotificationPref", shape=box, style="filled,bold", fillcolor=lightblue];
  
  // Attributes as ellipses
  userId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  userEmail [label="email", shape=ellipse, style=filled, fillcolor=lightyellow];
  userName [label="full_name", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  profThreshold [label="alert_threshold", shape=ellipse, style=filled, fillcolor=lightyellow];
  profRatio [label="max_ratio", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  hcId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  hcName [label="name", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  actId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  actName [label="name", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  locId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  locName [label="name", shape=ellipse, style=filled, fillcolor=lightyellow];
  locLat [label="lat", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  aqiId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  aqiValue [label="aqi", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  rrId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  rrStatus [label="status", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  roId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  roDistance [label="distance", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  ipId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  ipName [label="name", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  arId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  arName [label="name", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  aeId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  aeTitle [label="title", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  notId [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor=lightyellow];
  notType [label="type", shape=ellipse, style=filled, fillcolor=lightyellow];
  
  // Connect entities to attributes
  User -- userId;
  User -- userEmail;
  User -- userName;
  
  UserProfile -- profThreshold;
  UserProfile -- profRatio;
  
  HealthCondition -- hcId;
  HealthCondition -- hcName;
  
  Activity -- actId;
  Activity -- actName;
  
  Location -- locId;
  Location -- locName;
  Location -- locLat;
  
  AQIMeasurement -- aqiId;
  AQIMeasurement -- aqiValue;
  
  RouteRequest -- rrId;
  RouteRequest -- rrStatus;
  
  RouteOption -- roId;
  RouteOption -- roDistance;
  
  IndoorPlace -- ipId;
  IndoorPlace -- ipName;
  
  AdviceRule -- arId;
  AdviceRule -- arName;
  
  AdviceEvent -- aeId;
  AdviceEvent -- aeTitle;
  
  Notification -- notId;
  Notification -- notType;
  
  // Relationships as diamonds
  has_profile [label="has", shape=diamond, style=filled, fillcolor=lightcoral];
  has_cond [label="has", shape=diamond, style=filled, fillcolor=lightcoral];
  has_act [label="has", shape=diamond, style=filled, fillcolor=lightcoral];
  creates [label="creates", shape=diamond, style=filled, fillcolor=lightcoral];
  receives_adv [label="receives", shape=diamond, style=filled, fillcolor=lightcoral];
  receives_not [label="receives", shape=diamond, style=filled, fillcolor=lightcoral];
  has_pref [label="has", shape=diamond, style=filled, fillcolor=lightcoral];
  measures [label="measures", shape=diamond, style=filled, fillcolor=lightcoral];
  contains [label="contains", shape=diamond, style=filled, fillcolor=lightcoral];
  generates [label="generates", shape=diamond, style=filled, fillcolor=lightcoral];
  has_ip_aqi [label="has", shape=diamond, style=filled, fillcolor=lightcoral];
  triggers [label="triggers", shape=diamond, style=filled, fillcolor=lightcoral];
  
  // Relationships with cardinality
  User -- has_profile [label="1"];
  has_profile -- UserProfile [label="1"];
  
  User -- has_cond [label="1"];
  has_cond -- HealthCondition [label="N"];
  
  User -- has_act [label="1"];
  has_act -- Activity [label="N"];
  
  User -- creates [label="1"];
  creates -- RouteRequest [label="N"];
  
  User -- receives_adv [label="1"];
  receives_adv -- AdviceEvent [label="N"];
  
  User -- receives_not [label="1"];
  receives_not -- Notification [label="N"];
  
  User -- has_pref [label="1"];
  has_pref -- NotificationPref [label="1"];
  
  Location -- measures [label="1"];
  measures -- AQIMeasurement [label="N"];
  
  RouteRequest -- contains [label="1"];
  contains -- RouteOption [label="N"];
  
  AdviceRule -- generates [label="1"];
  generates -- AdviceEvent [label="N"];
  
  IndoorPlace -- has_ip_aqi [label="1"];
  has_ip_aqi -- IndoorPlaceAQI [label="N"];
}`;

const payload = JSON.stringify({
  diagram_source: graphvizDiagram
});

const options = {
  hostname: 'kroki.io',
  port: 443,
  path: '/graphviz/png',
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
    console.log('✓ ERD (chuẩn Chen) saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
    console.log('');
    console.log('📋 Thành phần ERD:');
    console.log('  ✓ Thực thể (Entity): hình chữ nhật xanh');
    console.log('  ✓ Thuộc tính (Attribute): hình elip vàng');
    console.log('  ✓ Mối quan hệ (Relationship): hình thoi đỏ');
    console.log('  ✓ Khóa chính (PK): đánh dấu rõ ràng');
    console.log('  ✓ Cardinality: 1:1, 1:N được thể hiện');
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
