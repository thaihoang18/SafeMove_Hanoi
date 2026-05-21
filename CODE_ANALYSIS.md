# SafeMove Hanoi - Demo Code Structure Analysis

## Executive Summary
The demo code demonstrates a **multi-screen mobile fitness/environmental quality application** with a cohesive design system. The architecture follows an **MVC-like pattern** with state management, DOM selectors, and event-driven functionality.

---

## 1. COMMON PATTERNS ACROSS ALL SCREENS

### 1.1 Structural Pattern
Every screen follows the same **phone-container wrapper** pattern:
```
├── Header (app-header)
│   ├── Logo Area
│   └── Avatar Button
├── Main Content (scrollable-content)
│   └── Screen-specific content
└── Bottom Navigation (bottom-nav)
    ├── Home Tab (🏠)
    ├── Search Tab (🔍)
    ├── Route Tab (🏃)
    └── Profile Tab (👤)
```

### 1.2 State Management Pattern
Each screen has a **ScreenState object** containing:
- `isGuest` - User authentication status
- `currentSource` / `activeFilter` - Active selection
- Data arrays (searchResults, reviews, spotInfo)
- Current values (aqiValue, weather, sorting)

### 1.3 DOM Reference Pattern
Each screen uses a **DOM object** that maps all interactive elements via `data-id` attributes:
```javascript
const DOM = {
    logoHeader: document.querySelector('[data-id="1"]'),
    avatarBtn: document.querySelector('[data-id="2"]'),
    // ... more elements
};
```
**Benefit**: Centralized element references, easy to refactor

### 1.4 Authentication Guard Pattern
```javascript
function checkAuthAndExecute(callback) {
    if (ScreenState.isGuest) {
        alert("Login required");
    } else {
        callback();
    }
}
```
Used for: Avatar clicks, profile access, review submission

---

## 2. DETAILED SCREEN BREAKDOWN

### SCREEN 1: HOME (AQI & Weather Dashboard)
**Purpose**: Display air quality index and health advice

#### HTML Structure:
- **AQI Section**: Large circular badge showing score (42) with label
- **Source Toggle Buttons**: Switch between "Hanoi Monitoring Station" vs "Global Air Quality Index"
- **Status Box**: Dynamic health message based on AQI level
- **Advice Card**: Green-bordered card with health recommendations
- **Weather Row**: Temperature display with refresh button

#### CSS Classes Used:
| Class | Purpose |
|-------|---------|
| `aqi-circle-border` | Large green circle for AQI score |
| `source-btn` / `.active` | Toggle buttons for data sources |
| `status-box` | Center-aligned health message |
| `advice-card` | Left-border green card |
| `weather-box` | Information panel |
| `dot.green` | Indicator dot |

#### JavaScript Logic:
```javascript
ScreenState = {
    isGuest: false,
    currentSource: 'main', // main or backup
    aqiValue: 42,
    weather: { temp: 28, humidity: 65 }
}

// Key Functions:
- fetchAQIData(sourceType) → Updates UI and toggles active button
- fetchWeatherData() → Refreshes weather info from API
- updateAQIUI(aqi) → Conditional messaging (≤50 = good, >50 = bad)
```

#### Event Handlers:
| Element | Event | Action |
|---------|-------|--------|
| Logo | click | `window.location.reload()` |
| Avatar | click | Navigate to profile (auth check) |
| AQI Circle | click | Navigate to AQI details (auth check) |
| Main Source Btn | click | `fetchAQIData('main')` |
| Backup Source Btn | click | `fetchAQIData('backup')` |
| Refresh Weather | click | `fetchWeatherData()` |
| Nav Tabs | click | `navigateTo(screenName)` |

---

### SCREEN 2: SEARCH (Location Discovery)
**Purpose**: Find parks, gyms, and fitness locations

#### HTML Structure:
- **Sticky Search Header**:
  - Search input with icon
  - Filter buttons: "Recent" (active), "Park", "Gym", "Favorite"
- **Result List**: Cards displaying locations with:
  - Image thumbnail
  - Name, distance
  - AQI badge (color-coded), "Japan-friendly" tag
- **Breathing Advice Card**: Context-aware recommendation

#### CSS Classes Used:
| Class | Purpose |
|-------|---------|
| `search-sticky-header` | Fixed header with z-index: 10 |
| `search-input-wrapper` | Icon + input container |
| `filter-tag` / `.active` | Filter buttons with toggle state |
| `spot-card` | Result item layout (flexbox) |
| `spot-img` | 60x60px image |
| `aqi-badge` | Color-coded AQI display |
| `.green-text` / `.orange-text` | AQI color coding |
| `japan-badge` | Green highlight badge |
| `breathing-card` | Light green card with advice |

#### JavaScript Logic:
```javascript
SearchScreenState = {
    isGuest: false,
    searchKeyword: '',
    activeFilter: 'near', // near, park, gym, favorite
    currentLocation: { lat: 21.0285, lng: 105.8542 },
    searchResults: [
        { id: 101, name: "Tong Nhat Park", aqi: 26, distance: 0.8, 
          isJapanFriendly: true, type: "park", img: "park.jpg" },
        // ... more locations
    ]
}

// Key Functions:
- performSearch(keyword) → Filters results by name
- filterResults(filterType) → Filters by type/category
- renderSearchResults(results) → Dynamic DOM creation
- updateAdviceCard(aqi) → Conditional health advice
```

#### Data Flow:
1. User types in search → `performSearch()` filters array
2. User clicks filter → `filterResults()` updates array
3. Results render → `renderSearchResults()` creates DOM elements
4. Click on item → Navigate to `spot_detail_screen`

---

### SCREEN 3: SPOT DETAIL (Location Information)
**Purpose**: Show detailed info about a park/gym with reviews

#### HTML Structure:
- **Top Badge**: "Green Spot" indicator
- **Location Name & Address**
- **Stats Grid** (2 columns):
  - Safety Score (92/100 in small circle)
  - PM2.5 concentration with WHO compliance note
- **Amenities Section**: Tag-based icons (water, shade)
- **Description Card**: Narrative about location
- **Reviews Section**:
  - Top reviews (limited)
  - Review input textarea + submit button
  - Review list with user avatar, name, stars, date
- **Floating Route Button**: Fixed position green circle (bottom-right)

#### CSS Classes Used:
| Class | Purpose |
|-------|---------|
| `green-sub-badge` | Light green badge with text |
| `stats-grid` | 2-column layout with gap |
| `small-aqi-circle` | 44x44px score circle |
| `stat-pm25-box` | PM2.5 information box |
| `amenities-tags` | Flex container for amenity badges |
| `amenity-tag` | Individual amenity chip |
| `review-textarea` | Input field for new review |
| `btn-submit-review` | Green submit button |
| `review-card` | Review item display |
| `rev-user-info` | User header section |
| `rev-avatar` | 32x32px user avatar |
| `floating-route-btn` | Fixed circle button (56x56px) |

#### JavaScript Logic:
```javascript
SpotDetailState = {
    isGuest: false,
    spotInfo: {
        id: 201,
        name: "Bach Thao Park",
        safetyScore: 92,
        pm25: 12,
        amenities: ["water", "shade"],
        description: "..."
    },
    reviews: [
        { id: 1, author: "Chan An", rating: 5, date: "2 ngay truoc", 
          content: "..." }
    ]
}

// Key Functions:
- renderSpotDetails() → Populate all spot information
- renderReviews() → Display review list
- handleReviewSubmission() → Submit new review (auth check)
- setupReviewInputPlaceholder() → Conditional UI based on auth
```

#### Review Submission Flow:
1. Check if user is guest → Show login prompt or allow input
2. Get textarea value
3. Create new review object with timestamp
4. Add to reviews array (prepend)
5. Clear input
6. Re-render reviews list

---

### SCREEN 4: ALL REVIEWS (Full Review List)
**Purpose**: Show all reviews for a location with sorting

#### HTML Structure:
- **Header**: Back button, location name
- **Rating Summary Box**:
  - Large score (4.8)
  - Star display
  - Total review count (128)
- **Distribution Graph**:
  - 5 rows for 5-star to 1-star ratings
  - Horizontal bar showing percentage distribution
- **List Header**: Title + Sort dropdown ("Latest" / "Highest rated")
- **Reviews Container**: Dynamically populated review items

#### CSS Classes Used:
| Class | Purpose |
|-------|---------|
| `review-header-nav` | Header with back button |
| `back-btn` | Back navigation button |
| `rating-summary-box` | Summary statistics |
| `big-score` | Large 4.8 rating display |
| `stars-display` | ⭐ emoji display |
| `distribution-graph-card` | Rating distribution chart |
| `graph-row` | Individual bar row |
| `bar-container` / `bar-fill` | Bar chart visualization |
| `sort-dropdown-btn` | Sort toggle button |
| `review-item-block` | Individual review card |
| `review-user-row` | User info header |
| `user-avatar-circle` | 36x36px avatar |
| `user-meta-details` | Name + date section |
| `individual-stars` | Star rating (★☆) |
| `review-body-text` | Review content |

#### JavaScript Logic:
```javascript
ReviewsScreenState = {
    spotName: "Bach Thao Park",
    currentSort: "latest", // or "highest"
    allReviews: [
        { id: 1, author: "Chan An", avatar: "...", rating: 5, 
          date: "2 ngay truoc", content: "..." },
        // ... more reviews
    ]
}

// Key Functions:
- handleBackAction() → window.history.back()
- toggleSortOrder() → Switch between latest/highest, re-sort array
- renderReviewsList(reviews) → Dynamic DOM creation with avatars
```

#### Sorting Logic:
```
IF currentSort === "latest":
  → Sort by ID (insertion order)
  → Update label to "評価の高い順" (highest rated)
  → currentSort = "highest"
ELSE:
  → Sort by rating descending
  → Update label to "最新順" (latest)
  → currentSort = "latest"
```

---

## 3. STYLING APPROACH

### 3.1 Design System & Color Scheme

#### CSS Variables (Root):
```css
--primary-green: #117843      /* Main brand color */
--light-green: #e6f4ea        /* Light green background */
--border-color: #ddd          /* Neutral borders */
--text-dark: #333             /* Primary text */
--text-muted: #666            /* Secondary text */
--background-gray: #f9f9f9    /* Light background */
```

#### Color Usage:
| Color | Usage |
|-------|-------|
| `#117843` (Green) | Navigation active, buttons, badges, accents |
| `#e6f4ea` (Light Green) | Card backgrounds, health-related panels |
| `#2e7d32` (Dark Green) | Good AQI text (≤50) |
| `#ef6c00` (Orange) | Moderate AQI text (50-100) |
| `#ffb300` (Gold) | Star ratings |
| `#f9f9f9` (Gray) | Background, alternate sections |

### 3.2 Typography

**Font Stack**:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, Helvetica, Arial, sans-serif;
```
Modern system fonts for clarity and performance

**Font Sizes**:
| Size | Use |
|------|-----|
| 48px | Large AQI numbers |
| 44px | Rating scores |
| 20-22px | Page titles |
| 14-16px | Card titles, location names |
| 12-14px | Body text, descriptions |
| 10-11px | Metadata (distance, date) |

### 3.3 Layout Patterns

#### Container Pattern:
- **Phone Container**: 375px × 812px (iPhone X dimensions)
- Border: 8px solid #333 (phone bezel)
- Border-radius: 40px (rounded corners)
- Box-shadow: 0 10px 25px rgba(0,0,0,0.2)

#### Flexbox Usage:
- **Header**: `flex` with `space-between` alignment
- **Bottom Nav**: `flex` with `space-around` (equal spacing)
- **Cards**: `flex` with `gap` for spacing
- **Sticky Header**: `position: sticky; top: 0; z-index: 10`

#### Scrollable Content:
```css
.scrollable-content {
    flex: 1;                    /* Takes available space */
    overflow-y: auto;           /* Vertical scroll only */
    padding: 16px;              /* Breathing room */
    padding-bottom: 80px;       /* Space for bottom nav */
    background-color: #f9f9f9;  /* Light background */
}
```

### 3.4 Component Styling

#### Cards:
```css
.card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}
```

#### Buttons:
- **Filter/Source Buttons**: White bg, gray border, `border-radius: 20px`
- **Active Buttons**: Green bg, white text
- **Submit Buttons**: Green bg, white text, wider padding
- **Floating Button**: Circular (56×56px), green, shadow effect

#### Badges:
- **AQI Badge**: Bold text, color-coded (green/orange)
- **Japan Badge**: Light green bg, green text, small padding
- **Status Badge**: Green background, white text, compact

---

## 4. DATA FLOW ARCHITECTURE

### 4.1 Unidirectional Data Flow Pattern

```
User Action → Event Listener → State Update → Re-render UI
```

**Example - Search Flow:**
```javascript
// 1. User types in search input
DOM.searchInput.addEventListener('input', (e) => {
    // 2. Update state
    performSearch(e.target.value);
});

// 3. In performSearch()
SearchScreenState.searchKeyword = keyword;
const filtered = SearchScreenState.searchResults.filter(...);

// 4. Render
renderSearchResults(filtered);
```

### 4.2 State Management Layers

#### Layer 1: Authentication State
```javascript
ScreenState.isGuest = true/false
↓
Used by checkAuthAndExecute() to gate features
↓
Conditionally show UI or prompt login
```

#### Layer 2: Selection State
```javascript
SearchScreenState.activeFilter = 'park'
SpotDetailState.currentReviewInput = "user text"
ReviewsScreenState.currentSort = 'latest'
↓
Determines which data is displayed
↓
Affects styling and filtering
```

#### Layer 3: Data State
```javascript
SearchScreenState.searchResults = [...]
SpotDetailState.reviews = [...]
↓
Source of truth for rendering
↓
Populated from "API" (mocked with data)
```

### 4.3 Navigation Flow

```
HOME (Screen 1)
  ├─ Avatar click → Profile (auth check)
  ├─ AQI click → AQI Details (auth check)
  ├─ Search tab → Search Screen (Screen 2)
  ├─ Route tab → Route Details (Screen 3)
  └─ Profile tab → Profile Screen

SEARCH (Screen 2)
  ├─ Logo → Home Screen
  ├─ Avatar → Profile (auth check)
  ├─ Spot item click → Spot Detail (Screen 3)
  └─ All nav tabs → Respective screens

SPOT DETAIL (Screen 3)
  ├─ Logo → Home Screen
  ├─ Avatar → Profile (auth check)
  ├─ View All Reviews → All Reviews Screen (Screen 4)
  ├─ Submit Review → Add to reviews array (auth check)
  └─ Floating button → Route navigation

ALL REVIEWS (Screen 4)
  ├─ Back button → Spot Detail (Screen 3)
  └─ Sort button → Toggle sort order & re-render
```

---

## 5. COMPONENT ORGANIZATION

### 5.1 Reusable Components

#### Card Component:
```html
<div class="card">
    <h3>Title</h3>
    <p>Content</p>
</div>
```
Used in: All screens (different contexts)

#### Badge System:
```html
<span class="aqi-badge green-text">AQI 26</span>
<span class="japan-badge">日本対応</span>
<span class="amenity-tag">💧 Water</span>
```

#### Button Styles:
```html
<!-- Source/Filter buttons -->
<button class="source-btn active">Option</button>

<!-- Floating action button -->
<button class="floating-route-btn">🏃</button>

<!-- Submit button -->
<button class="btn-submit-review">Send</button>
```

#### Rating Display:
```html
<div class="stars">⭐⭐⭐⭐⭐</div>
<!-- Or individual stars -->
<span>${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span>
```

### 5.2 Template Patterns in JavaScript

#### Search Result Template:
```javascript
const itemElement = document.createElement('div');
itemElement.innerHTML = `
    <img src="${item.img}" class="spot-img">
    <div class="spot-info">
        <h4>${item.name}</h4>
        <p class="distance">${item.distance} km</p>
    </div>
    <div class="spot-badges">
        <span class="aqi-badge">AQI ${item.aqi}</span>
        ${item.isJapanFriendly ? '<span class="badge-japan">日本対応</span>' : ''}
    </div>
`;
```

#### Review Item Template:
```javascript
const revBlock = document.createElement('div');
revBlock.innerHTML = `
    <div class="review-user-row">
        <img src="${item.avatar}" class="user-avatar-circle">
        <div class="user-meta-details">
            <h5>${item.author}</h5>
            <span class="timestamp-txt">${item.date}</span>
        </div>
        <div class="individual-stars">
            ${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}
        </div>
    </div>
    <p class="review-body-text">「${item.content}」</p>
`;
```

---

## 6. KEY INTERACTIONS & BUSINESS LOGIC

### 6.1 Authentication Flow
```javascript
// Every auth-required feature:
checkAuthAndExecute(() => {
    navigateTo('destination');
});

// If guest: Show alert "Login required"
// If logged in: Execute callback
```
Used for:
- Profile access (avatar click)
- AQI detailed info
- Review submission
- Favorite marking

### 6.2 AQI-Based Conditional Content
```javascript
if (aqi <= 50) {
    // Show "Good air quality" message
    // Show green-themed advice
    // Enable outdoor activity recommendations
} else {
    // Show "Polluted air" warning
    // Show caution-themed advice
    // Recommend sensitive groups avoid outdoor activity
}
```

### 6.3 Data Source Switching
```javascript
// Screen 1: Switch between data sources
fetchAQIData('main')    // Hanoi Monitoring Station
fetchAQIData('backup')  // Global Air Quality Index

// Updates UI and toggles button state
// Different mock AQI values (42 vs 55)
```

### 6.4 Filter & Search Combination
```javascript
// Search by keyword + filter by type
const filtered = SearchScreenState.searchResults
    .filter(item => item.name.toLowerCase().includes(keyword))
    .filter(item => filterType === 'near' || item.type === filterType);
```

### 6.5 Dynamic Review Submission
```javascript
// 1. Validate input
if (!content.trim()) return alert("Required");

// 2. Create object with metadata
const newReview = {
    id: Date.now(),
    author: "Current User",
    rating: 5,
    date: "Just now",
    content: content
};

// 3. Prepend to array (newest first)
SpotDetailState.reviews.unshift(newReview);

// 4. Clear input & re-render
DOM.reviewInput.value = '';
renderReviews();
```

---

## 7. NAVIGATION STRUCTURE

### Bottom Navigation Bar (Global)

```html
<nav class="bottom-nav">
    <a href="#" class="nav-item active">🏠 ホーム</a>      <!-- Screen 1 -->
    <a href="#" class="nav-item">🔍 検索</a>              <!-- Screen 2 -->
    <a href="#" class="nav-item">🏃 ルート</a>            <!-- Screen 3 -->
    <a href="#" class="nav-item">👤 プロフィール</a>      <!-- Profile -->
</nav>
```

**Fixed Positioning**:
- Position: absolute, bottom: 0
- Height: 60px
- z-index: 50 (on top of content)
- Spacing compensated with `padding-bottom: 80px` on scrollable content

### Navigation Interactions

#### Header Navigation:
- **Logo**: Page reload / Home
- **Avatar**: Profile access (auth gated)

#### Contextual Navigation:
- **Back buttons**: Use in detail/review screens
- **View All links**: Expand limited results
- **Tab navigation**: Switch primary sections

---

## 8. TECHNICAL INSIGHTS & BEST PRACTICES

### 8.1 DOM Querying Strategy
✅ **Good**:
```javascript
const DOM = {
    element: document.querySelector('[data-id="1"]')
};
DOM.element.addEventListener(...);
```

❌ **Avoided**:
- Repeated `document.querySelector()` calls
- Hardcoding selectors in event listeners

### 8.2 Responsive Design
- Fixed phone container (375×812px) simulates real device
- All content scales within this container
- No media queries needed (desktop/tablet simulation via wrapper)

### 8.3 Performance Considerations
- State stored in simple objects (no heavy libraries)
- DOM references cached in `DOM` object
- Event delegation could be used for list items (currently individual listeners)
- Mocked API calls (simulated with mock data arrays)

### 8.4 Code Organization
```
For each screen:
1. State object
2. DOM references
3. Logic functions
4. Event listeners
5. Initialization
```
Clear separation of concerns, easy to maintain and extend

### 8.5 Accessibility Notes
- Using emojis for icons (native support)
- Data-id attributes for element tracking
- Alt text for images
- Semantic HTML (nav, main, header)

---

## 9. SUMMARY TABLE: SCREEN FEATURES

| Feature | Screen 1 | Screen 2 | Screen 3 | Screen 4 |
|---------|----------|----------|----------|----------|
| **Primary Purpose** | AQI Dashboard | Search Places | Location Details | Reviews List |
| **Main Data** | AQI Score | Locations | Place Info | Reviews |
| **Key UI Element** | Large AQI Circle | Filter Buttons | Stats Grid | Rating Distribution |
| **User Input** | Button clicks | Search + Filters | Review textarea | Sort toggle |
| **Dynamic Rendering** | Conditional text | List of cards | Reviews list | Sorted reviews |
| **Auth-gated Feature** | Avatar, AQI detail | N/A | Review submit | N/A |
| **Navigation Out** | All 4 tabs | 3 tabs + detail | Detail + reviews | Back button |
| **Data Flow** | Simple state update | Filter + search | Form submission | Sort array |

---

## 10. RECOMMENDATIONS FOR ENHANCEMENT

### 10.1 Refactoring Opportunities
1. **Extract reusable components**: Create `renderCard()`, `renderBadge()` functions
2. **Event delegation**: Use delegated events for list items (reduce listeners)
3. **API integration**: Replace mock data with actual API calls
4. **Error handling**: Add try-catch and user feedback for network issues

### 10.2 Feature Additions
- Favorites system (persist selected locations)
- Notification alerts for AQI thresholds
- User preferences (preferred exercise types, locations)
- Real-time location tracking for distance calculations
- Image upload for reviews

### 10.3 Performance Optimization
- Lazy load images in review/search lists
- Debounce search input
- Virtualize long lists (render only visible items)
- Service worker for offline support

---

## CONCLUSION

The SafeMove Hanoi demo code demonstrates a **well-structured, scalable approach** to building multi-screen mobile applications. Key strengths include:

✅ **Consistent patterns** across all screens
✅ **Clear state management** with predictable data flow
✅ **Reusable component styling** via CSS classes
✅ **Authentication-aware UI** with proper gating
✅ **Responsive interactions** with real-time updates
✅ **Clean separation** between logic and presentation

The codebase is production-ready for extension into a full React/Vue application or expansion with backend integration.
