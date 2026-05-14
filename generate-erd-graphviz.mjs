import fs from 'fs';
import https from 'https';

const graphvizDiagram = `digraph SafeMove_HaNoi_ERD {
  rankdir=LR;
  node [shape=box, style=filled, fillcolor=lightblue];
  
  // Entities (boxes)
  USERS [label="USERS", shape=box, fillcolor=lightblue];
  USER_PROFILES [label="USER_PROFILES", shape=box, fillcolor=lightblue];
  USER_CONDITIONS [label="USER_CONDITIONS", shape=box, fillcolor=lightblue];
  USER_ACTIVITIES [label="USER_ACTIVITIES", shape=box, fillcolor=lightblue];
  HEALTH_CONDITIONS [label="HEALTH_CONDITIONS", shape=box, fillcolor=lightblue];
  ACTIVITIES [label="ACTIVITIES", shape=box, fillcolor=lightblue];
  LOCATIONS [label="LOCATIONS", shape=box, fillcolor=lightblue];
  AQI_MEASUREMENTS [label="AQI_MEASUREMENTS", shape=box, fillcolor=lightblue];
  ROUTE_REQUESTS [label="ROUTE_REQUESTS", shape=box, fillcolor=lightblue];
  ROUTE_OPTIONS [label="ROUTE_OPTIONS", shape=box, fillcolor=lightblue];
  INDOOR_PLACES [label="INDOOR_PLACES", shape=box, fillcolor=lightblue];
  INDOOR_PLACE_AQI [label="INDOOR_PLACE_AQI", shape=box, fillcolor=lightblue];
  ADVICE_RULES [label="ADVICE_RULES", shape=box, fillcolor=lightblue];
  ADVICE_EVENTS [label="ADVICE_EVENTS", shape=box, fillcolor=lightblue];
  NOTIFICATIONS [label="NOTIFICATIONS", shape=box, fillcolor=lightblue];
  NOTIFICATION_PREFERENCES [label="NOTIFICATION_PREFERENCES", shape=box, fillcolor=lightblue];
  
  // Attributes (circles/ellipses)
  // USERS attributes
  user_id [label="id (PK)", shape=ellipse, fillcolor=lightyellow];
  user_email [label="email (UK)", shape=ellipse, fillcolor=lightyellow];
  user_pwd [label="password_hash", shape=ellipse, fillcolor=lightyellow];
  user_name [label="full_name", shape=ellipse, fillcolor=lightyellow];
  user_birth [label="birth_year", shape=ellipse, fillcolor=lightyellow];
  user_lat [label="home_lat", shape=ellipse, fillcolor=lightyellow];
  user_lng [label="home_lng", shape=ellipse, fillcolor=lightyellow];
  user_created [label="created_at", shape=ellipse, fillcolor=lightyellow];
  user_updated [label="updated_at", shape=ellipse, fillcolor=lightyellow];
  
  USERS -- user_id;
  USERS -- user_email;
  USERS -- user_pwd;
  USERS -- user_name;
  USERS -- user_birth;
  USERS -- user_lat;
  USERS -- user_lng;
  USERS -- user_created;
  USERS -- user_updated;
  
  // USER_PROFILES attributes
  prof_uid [label="user_id (FK,PK)", shape=ellipse, fillcolor=lightyellow];
  prof_threshold [label="alert_threshold", shape=ellipse, fillcolor=lightyellow];
  prof_ratio [label="default_max_route_ratio", shape=ellipse, fillcolor=lightyellow];
  prof_activity [label="primary_activity_id (FK)", shape=ellipse, fillcolor=lightyellow];
  prof_mask [label="mask_preference", shape=ellipse, fillcolor=lightyellow];
  
  USER_PROFILES -- prof_uid;
  USER_PROFILES -- prof_threshold;
  USER_PROFILES -- prof_ratio;
  USER_PROFILES -- prof_activity;
  USER_PROFILES -- prof_mask;
  
  // HEALTH_CONDITIONS attributes
  hc_id [label="id (PK)", shape=ellipse, fillcolor=lightyellow];
  hc_slug [label="slug (UK)", shape=ellipse, fillcolor=lightyellow];
  hc_name [label="name (UK)", shape=ellipse, fillcolor=lightyellow];
  hc_desc [label="description", shape=ellipse, fillcolor=lightyellow];
  
  HEALTH_CONDITIONS -- hc_id;
  HEALTH_CONDITIONS -- hc_slug;
  HEALTH_CONDITIONS -- hc_name;
  HEALTH_CONDITIONS -- hc_desc;
  
  // ACTIVITIES attributes
  act_id [label="id (PK)", shape=ellipse, fillcolor=lightyellow];
  act_slug [label="slug (UK)", shape=ellipse, fillcolor=lightyellow];
  act_name [label="name (UK)", shape=ellipse, fillcolor=lightyellow];
  act_desc [label="description", shape=ellipse, fillcolor=lightyellow];
  
  ACTIVITIES -- act_id;
  ACTIVITIES -- act_slug;
  ACTIVITIES -- act_name;
  ACTIVITIES -- act_desc;
  
  // LOCATIONS attributes
  loc_id [label="id (PK)", shape=ellipse, fillcolor=lightyellow];
  loc_name [label="name", shape=ellipse, fillcolor=lightyellow];
  loc_type [label="location_type", shape=ellipse, fillcolor=lightyellow];
  loc_city [label="city", shape=ellipse, fillcolor=lightyellow];
  loc_lat [label="lat", shape=ellipse, fillcolor=lightyellow];
  loc_lng [label="lng", shape=ellipse, fillcolor=lightyellow];
  
  LOCATIONS -- loc_id;
  LOCATIONS -- loc_name;
  LOCATIONS -- loc_type;
  LOCATIONS -- loc_city;
  LOCATIONS -- loc_lat;
  LOCATIONS -- loc_lng;
  
  // Relationships (diamonds)
  has_profile [label="has", shape=diamond, fillcolor=lightcoral];
  has_condition [label="has", shape=diamond, fillcolor=lightcoral];
  has_activity [label="has", shape=diamond, fillcolor=lightcoral];
  creates_request [label="creates", shape=diamond, fillcolor=lightcoral];
  receives_advice [label="receives", shape=diamond, fillcolor=lightcoral];
  receives_notif [label="receives", shape=diamond, fillcolor=lightcoral];
  has_prefs [label="has", shape=diamond, fillcolor=lightcoral];
  measured_at [label="measured_at", shape=diamond, fillcolor=lightcoral];
  contains_option [label="contains", shape=diamond, fillcolor=lightcoral];
  generates_event [label="generates", shape=diamond, fillcolor=lightcoral];
  
  // Relationships connections
  USERS -- has_profile -- USER_PROFILES;
  USERS -- has_condition -- USER_CONDITIONS;
  USERS -- has_activity -- USER_ACTIVITIES;
  USERS -- creates_request -- ROUTE_REQUESTS;
  USERS -- receives_advice -- ADVICE_EVENTS;
  USERS -- receives_notif -- NOTIFICATIONS;
  USERS -- has_prefs -- NOTIFICATION_PREFERENCES;
  
  HEALTH_CONDITIONS -- has_condition -- USER_CONDITIONS;
  ACTIVITIES -- has_activity -- USER_ACTIVITIES;
  
  LOCATIONS -- measured_at -- AQI_MEASUREMENTS;
  ROUTE_REQUESTS -- contains_option -- ROUTE_OPTIONS;
  ADVICE_RULES -- generates_event -- ADVICE_EVENTS;
  INDOOR_PLACES -- measured_at -- INDOOR_PLACE_AQI;
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
    console.log('✓ ERD PNG saved: ./db/ERD-SafeMove-HaNoi.png (' + stats.size + ' bytes)');
    console.log('✓ Entities: boxes (blue)');
    console.log('✓ Attributes: circles (yellow)');
    console.log('✓ Relationships: diamonds (red)');
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
