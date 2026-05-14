import fs from 'fs';
import https from 'https';

const graphvizDiagram = `digraph SafeMove_HaNoi_ERD {
  rankdir=LR;
  node [fontname="Arial", fontsize=9];
  edge [fontname="Arial", fontsize=8];
  
  // ENTITIES (rectangles)
  User [label="User", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  UserProfile [label="UserProfile", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  HealthCondition [label="HealthCondition", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  Activity [label="Activity", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  Location [label="Location", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  AQIMeasurement [label="AQIMeasurement", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  RouteRequest [label="RouteRequest", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  RouteOption [label="RouteOption", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  IndoorPlace [label="IndoorPlace", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  IndoorPlaceAQI [label="IndoorPlaceAQI", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  AdviceRule [label="AdviceRule", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  AdviceEvent [label="AdviceEvent", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  Notification [label="Notification", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  NotificationPref [label="NotificationPref", shape=box, style=filled, fillcolor="#90EE90", penwidth=2];
  
  // USER ATTRIBUTES (ellipses)
  uid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  uemail [label="email", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  uname [label="full_name", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ubirth [label="birth_year", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ulat [label="home_lat", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ulng [label="home_lng", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // USERPROFILE ATTRIBUTES
  puid [label="user_id\\n(PK,FK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  pthreshold [label="alert_threshold", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  pratio [label="max_ratio", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // HEALTHCONDITION ATTRIBUTES
  hid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  hname [label="name", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  hdesc [label="description", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // ACTIVITY ATTRIBUTES
  aid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  aname [label="name", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // LOCATION ATTRIBUTES
  lid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  lname [label="name", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ltype [label="type", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  llat [label="lat", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  llng [label="lng", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // AQI ATTRIBUTES
  aqiid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  aqivalue [label="aqi", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  measured [label="measured_at", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // ROUTEREQUEST ATTRIBUTES
  rrid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  rrorigin [label="origin_lat/lng", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  rrdest [label="dest_lat/lng", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  rrstatus [label="status", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // ROUTEOPTION ATTRIBUTES
  roid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  rodist [label="distance_m", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  roaqi [label="avg_aqi", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // INDOORPLACE ATTRIBUTES
  ipid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ipname [label="name", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // INDOORPLACEAQI ATTRIBUTES
  iaqiid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  iaqivalue [label="aqi", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // ADVICERULE ATTRIBUTES
  arid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  arname [label="name", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  armin [label="aqi_min", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  armax [label="aqi_max", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // ADVICEEVENT ATTRIBUTES
  aeid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  aetitle [label="title", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  aeseverity [label="severity", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // NOTIFICATION ATTRIBUTES
  nid [label="id\\n(PK)", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ntype [label="type", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  ntitle [label="title", shape=ellipse, style=filled, fillcolor="#BFFF00"];
  
  // Connect entities to attributes
  User -- uid;
  User -- uemail;
  User -- uname;
  User -- ubirth;
  User -- ulat;
  User -- ulng;
  
  UserProfile -- puid;
  UserProfile -- pthreshold;
  UserProfile -- pratio;
  
  HealthCondition -- hid;
  HealthCondition -- hname;
  HealthCondition -- hdesc;
  
  Activity -- aid;
  Activity -- aname;
  
  Location -- lid;
  Location -- lname;
  Location -- ltype;
  Location -- llat;
  Location -- llng;
  
  AQIMeasurement -- aqiid;
  AQIMeasurement -- aqivalue;
  AQIMeasurement -- measured;
  
  RouteRequest -- rrid;
  RouteRequest -- rrorigin;
  RouteRequest -- rrdest;
  RouteRequest -- rrstatus;
  
  RouteOption -- roid;
  RouteOption -- rodist;
  RouteOption -- roaqi;
  
  IndoorPlace -- ipid;
  IndoorPlace -- ipname;
  
  IndoorPlaceAQI -- iaqiid;
  IndoorPlaceAQI -- iaqivalue;
  
  AdviceRule -- arid;
  AdviceRule -- arname;
  AdviceRule -- armin;
  AdviceRule -- armax;
  
  AdviceEvent -- aeid;
  AdviceEvent -- aetitle;
  AdviceEvent -- aeseverity;
  
  Notification -- nid;
  Notification -- ntype;
  Notification -- ntitle;
  
  // RELATIONSHIPS (diamonds)
  rel_has_profile [label="has", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_has_cond [label="has", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_has_act [label="has", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_creates [label="creates", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_receives [label="receives", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_has_pref [label="has", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_measures [label="measures", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_contains [label="contains", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_generates [label="generates", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  rel_has_indoor [label="has", shape=diamond, style=filled, fillcolor="#FFD700", penwidth=2];
  
  // RELATIONSHIPS with cardinality
  User -- rel_has_profile [label="1"];
  rel_has_profile -- UserProfile [label="1"];
  
  User -- rel_has_cond [label="1"];
  rel_has_cond -- HealthCondition [label="M"];
  
  User -- rel_has_act [label="1"];
  rel_has_act -- Activity [label="M"];
  
  User -- rel_creates [label="1"];
  rel_creates -- RouteRequest [label="M"];
  
  User -- rel_receives [label="1"];
  rel_receives -- AdviceEvent [label="M"];
  
  User -- rel_has_pref [label="1"];
  rel_has_pref -- NotificationPref [label="1"];
  
  Location -- rel_measures [label="1"];
  rel_measures -- AQIMeasurement [label="M"];
  
  RouteRequest -- rel_contains [label="1"];
  rel_contains -- RouteOption [label="M"];
  
  AdviceRule -- rel_generates [label="1"];
  rel_generates -- AdviceEvent [label="M"];
  
  IndoorPlace -- rel_has_indoor [label="1"];
  rel_has_indoor -- IndoorPlaceAQI [label="M"];
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
    console.log('✓ ERD (Chen Standard) saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
    console.log('');
    console.log('📊 ERD theo chuẩn Chen:');
    console.log('  ✓ Thực thể: Hình chữ nhật xanh lá');
    console.log('  ✓ Thuộc tính: Hình elip vàng');
    console.log('  ✓ Mối quan hệ: Hình thoi vàng');
    console.log('  ✓ Khóa chính (PK): Gạch chân');
    console.log('  ✓ Cardinality: M (many), 1 (one)');
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
