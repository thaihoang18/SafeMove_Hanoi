# SafeMove UI Components - Demo Design Implementation

## 📋 Overview
Các components React mới được tạo dựa trên design demo từ các file trong `assets/demo_JS_code_screen(99%)/`.

---

## 🎨 Components Tạo Mới

### 1. **ShellDemo** (`src/components/ShellDemo.tsx`)
- **Mục đích**: Layout chính + Navigation
- **File CSS**: `src/styles/demo-shell.css`
- **Features**:
  - Header với logo + avatar button
  - Scrollable main content
  - Bottom navigation (4 tabs: Home, Search, Route, Profile)
  - Responsive design

**Cách sử dụng**:
```tsx
<ShellDemo
  role="user"
  view={currentView}
  setView={setCurrentView}
  userName="Trần An"
  onRequireLogin={handleLogin}
  onLogout={handleLogout}
>
  {/* Content component here */}
</ShellDemo>
```

---

### 2. **HomeViewDemo** (`src/components/HomeViewDemo.tsx`)
- **Mục đích**: Màn hình Home - Hiển thị AQI, weather, advice
- **File CSS**: `src/styles/demo-home.css`
- **Screen Reference**: Screen 1 (demo)
- **Features**:
  - AQI circle hiển thị (160px border circle)
  - Source selection buttons
  - Weather information
  - Advice card
  - Recent routes list

**Props**:
```tsx
type Props = {
  dashboard: DashboardResponse | null;
  advice: { severity: string; title: string; body: string } | null;
  onOpenRoute: () => void;
  onOpenProfile: () => void;
  gpsAqi: { aqi: number | null; location_name: string; ... } | null;
  gpsCoords: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  onRefreshGpsAqi: () => void;
};
```

---

### 3. **SearchLocationsView** (`src/components/SearchLocationsView.tsx`)
- **Mục đích**: Tìm kiếm và lọc địa điểm
- **File CSS**: `src/styles/demo-search.css`
- **Screen Reference**: Screen 2 (demo)
- **Features**:
  - Sticky search header với search input
  - Filter tags (Parks, Gym, Sports, All)
  - Spot cards hiển thị (image, name, distance, AQI badge)
  - Breathing advice card
  - Favorite button

**Props**:
```tsx
type Props = {
  locations: PlaceCatalogItem[];
  onSelectLocation: (location: PlaceCatalogItem) => void;
  onRequireLogin?: () => void;
};
```

---

### 4. **LocationDetailView** (`src/components/LocationDetailView.tsx`)
- **Mục đích**: Chi tiết địa điểm - an toàn, PM2.5, amenities, reviews
- **File CSS**: `src/styles/demo-detail.css`
- **Screen Reference**: Screen 3 (demo)
- **Features**:
  - Location header với badge "Safe Spot"
  - Safety score circle + PM2.5 display
  - Amenities tags
  - About section
  - Review input (authenticated users only)
  - Review list
  - Floating route button

**Props**:
```tsx
type Props = {
  location: PlaceCatalogItem | null;
  onOpenRoute: () => void;
  onOpenReviews?: () => void;
  isGuest: boolean;
  onRequireLogin?: () => void;
};
```

---

### 5. **ReviewsListView** (`src/components/ReviewsListView.tsx`)
- **Mục đích**: Danh sách đầy đủ các reviews
- **File CSS**: `src/styles/demo-reviews.css`
- **Screen Reference**: Screen 4 (demo)
- **Features**:
  - Header với back button
  - Rating summary (average score + stars)
  - Distribution graph (bar chart của rating distribution)
  - Sort dropdown (Recent, Highest, Lowest)
  - Full review list

**Props**:
```tsx
type Props = {
  locationName: string;
  reviews: Review[];
  onBack: () => void;
};
```

---

### 6. **LoginScreenDemo** (`src/components/LoginScreenDemo.tsx`)
- **Mục đích**: Màn hình đăng nhập
- **File CSS**: `src/styles/demo-auth.css`
- **Screen Reference**: Screen 11 (demo)
- **Features**:
  - Email input với icon
  - Password input
  - Forgot password link
  - Login button
  - Register prompt
  - Form validation

**Props**:
```tsx
type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegisterClick: () => void;
  isLoading?: boolean;
  error?: string;
};
```

---

### 7. **RegisterScreenDemo** (`src/components/RegisterScreenDemo.tsx`)
- **Mục đích**: Màn hình đăng ký tài khoản mới
- **File CSS**: `src/styles/demo-auth.css`
- **Screen Reference**: Screen 12 (demo)
- **Features**:
  - Name input
  - Email input
  - Password input (8-16 chars validation)
  - Confirm password input
  - Register button
  - Login prompt
  - Password strength validation

**Props**:
```tsx
type Props = {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onLoginClick: () => void;
  isLoading?: boolean;
  error?: string;
};
```

---

### 8. **ProfileViewDemo** (`src/components/ProfileViewDemo.tsx`)
- **Mục đích**: Màn hình hồ sơ người dùng
- **File CSS**: `src/styles/demo-profile.css`
- **Screen Reference**: Screen 13 (demo)
- **Features**:
  - Profile header với avatar
  - Personal info section (name, email, phone - with inline edit)
  - App settings section:
    - AQI alert threshold slider (0-200)
    - Push notifications toggle
    - Email updates toggle
  - Logout button

**Props**:
```tsx
type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    joinDate?: string;
    avatar?: string;
  } | null;
  onUpdateProfile: (field: string, value: string) => Promise<void>;
  onLogout: () => void;
  isLoading?: boolean;
};
```

---

## 🎯 Color Scheme (từ Demo)

```css
--primary-green: #117843;       /* Main green color */
--light-green: #e6f4ea;         /* Light green background */
--border-color: #ddd;            /* Border color */
--text-dark: #333;               /* Dark text */
--text-muted: #666;              /* Muted text */
--background-gray: #f9f9f9;      /* Background gray */
```

---

## 📱 Screen Mapping

| Screen # | Component | Features |
|----------|-----------|----------|
| 1 | HomeViewDemo | AQI, weather, advice, navigation |
| 2 | SearchLocationsView | Search, filters, location cards |
| 3 | LocationDetailView | Detail, amenities, reviews, route button |
| 4 | ReviewsListView | Rating summary, distribution, reviews list |
| 5-6 | (Can integrate into LocationDetailView) | Health alert |
| 11 | LoginScreenDemo | Email, password login |
| 12 | RegisterScreenDemo | Name, email, password signup |
| 13 | ProfileViewDemo | User info, settings, profile |

---

## 🔄 Integration Steps

### Step 1: Replace Shell
```tsx
// Before
import { Shell } from "./components/Shell";

// After
import { ShellDemo } from "./components/ShellDemo";
```

### Step 2: Replace HomeView
```tsx
// Before
<HomeView dashboard={dashboard} ... />

// After
<HomeViewDemo dashboard={dashboard} ... />
```

### Step 3: Add New Views to App.tsx
```tsx
const [view, setView] = useState<View>("home");

return (
  <ShellDemo view={view} setView={setView} ...>
    {view === "home" && <HomeViewDemo ... />}
    {view === "search" && <SearchLocationsView ... />}
    {view === "spot-detail" && <LocationDetailView ... />}
    {view === "reviews" && <ReviewsListView ... />}
  </ShellDemo>
);
```

---

## 📦 Dependencies Used

- **React Icons**: `lucide-react` (for icons)
- **CSS**: Custom CSS (no Tailwind needed for demo components)
- **Types**: TypeScript with custom types

---

## 🎨 CSS Organization

All demo-related CSS files are in `src/styles/demo-*.css`:
- `demo-shell.css` - Layout + navigation
- `demo-home.css` - Home screen styling
- `demo-search.css` - Search screen styling
- `demo-detail.css` - Detail screen styling
- `demo-reviews.css` - Reviews screen styling

---

## ✅ Features Implemented

- ✅ Mobile-first responsive design
- ✅ Sticky headers and search
- ✅ Color-coded AQI badges
- ✅ Rating stars display
- ✅ Filter buttons and sorting
- ✅ Floating action buttons
- ✅ Guest/User role handling
- ✅ Form validation (review input, auth)
- ✅ Card-based UI components

---

## 🚀 Next Steps

1. Create LoginScreenDemo for authentication UI
2. Create RegisterScreenDemo for signup
3. Create ProfileViewDemo for user profile
4. Create Admin dashboard components (Screens 7-10)
5. Test responsive design on mobile
6. Integrate with backend API calls
7. Add animations and transitions

---

## 📝 Notes

- All components follow demo design from Screens 1-4
- Colors match the demo specification
- Layout uses phone-first approach (375px width)
- Components are fully responsive
- TypeScript types included for type safety
- CSS uses CSS variables for easy customization

---

**Created**: May 19, 2026
**Based on**: assets/demo_JS_code_screen(99%)/
**Status**: Components Ready for Integration
