# 🧪 TESTING GUIDE - Tab 1 (Peta Radar)

## Quick Start Testing

### Prerequisites
```bash
# Terminal 1: Start Expo
cd "d:\Semester 5\PGPBL\Project'S 7\myapp"
npx expo start

# Terminal 2: TypeScript watch (optional)
npx tsc --watch --noEmit
```

---

## TEST SCENARIO 1: Map Renders Correctly

### Steps
1. Start Expo dev server
2. Open Expo Go on device/emulator
3. Navigate to Tab 1 (Radar)

### Expected Results
- ✅ Map displays with DIY coordinate center
- ✅ 5 colored polygons visible (Sleman, Bantul, Kulon Progo, Gunung Kidul, Kota Yogyakarta)
- ✅ Polygon colors match their weather:
  - Blue = Hujan
  - Yellow = Cerah
  - Gray = Berawan
  - Transparent = Default
- ✅ Firebase markers display (if any in database)
- ✅ FAB button (+) visible at bottom-right
- ✅ No errors in console

### Console Checks
```
✅ No error: "react-native-maps not available"
✅ No error: "Invalid coordinates"
✅ Weather data logs show 5 successful fetches (or expected errors)
```

---

## TEST SCENARIO 2: Weather Color Mapping

### Test Case 2.1: Rainy Region
**Setup:**
- Go to Sleman region (usually rainy in actual BMKG data)

**Expected:**
- Polygon color = Blue (rgba(0, 100, 200, 0.4))
- Or weather description contains "Hujan" or "Gerimis"

### Test Case 2.2: Sunny Region
**Setup:**
- Go to any region with "Cerah" in weather desc

**Expected:**
- Polygon color = Yellow (rgba(255, 200, 0, 0.3))

### Test Case 2.3: Cloudy Region
**Setup:**
- Go to region with "Berawan" or "Mendung"

**Expected:**
- Polygon color = Gray (rgba(150, 150, 150, 0.3))

### Verification Method
```javascript
// Open browser DevTools > Network
// Find requests to: api.bmkg.go.id/publik/prakiraan-cuaca
// Response should contain weather_desc field
// Manually trace getPolygonColor() logic
```

---

## TEST SCENARIO 3: Navigation from Tab 3 → Tab 1

### Steps
1. Navigate to Tab 3 (Info Cuaca)
2. Wait for weather list to load
3. Click "Lihat di Peta Radar" button on ANY card

### Expected Results
- ✅ Immediately switch to Tab 1
- ✅ Map smoothly animates/zooms for 1 second
- ✅ Camera focus on the selected region's center coordinate
- ✅ Polygon of selected region turns RED with bright fill
- ✅ Info overlay appears with:
  - Region name
  - Weather description
  - Temperature

### Animation Timing
```
T=0s:    Click "Lihat Peta"
T=0-1s:  Smooth camera animation
T=1s:    Camera arrives, polygon highlight active
T=1-5s:  Blink effect continues
T=5s:    Auto-timeout, highlight stops
T>5s:    Polygon returns to normal weather color
```

---

## TEST SCENARIO 4: Blinking Effect (Radar Animation)

### Visual Verification
When region is highlighted, polygon should:

**Observable Pattern (every 500ms cycle):**
```
1. Bright Red Fill (rgba(255, 0, 0, 0.5))
   ↓ 500ms
2. Dim Red Fill (rgba(255, 0, 0, 0.1))
   ↓ 500ms
3. Bright Red Fill (repeat)
```

**Total Duration:** 5 seconds (10 blinks)

### Verification Method
```javascript
// Open console and observe logs:
console.log('Blink toggle:', isBlinking);

// Or manually count blinks in 5 seconds
// Should see ~10 transitions (5 on, 5 off)
```

---

## TEST SCENARIO 5: Info Overlay Display

### When Overlay Should Appear
- Only when `activeRegionId` is not null
- I.e., ONLY during highlight (first 5 seconds after click)

### Overlay Content Verification
```
┌─────────────────────────┐
│ Kabupaten Sleman        │  ← Region name (from DATA_DIY)
│ Hujan Petir             │  ← Weather desc (from BMKG API)
│ 26°C                    │  ← Temperature (from BMKG API)
└─────────────────────────┘
```

### Positioning
- Located at **top-left** of screen
- Padding: 20px from edges
- White background with shadow

### Auto-Hide Behavior
After 5 seconds:
- Overlay should fade/disappear
- activeRegionId becomes null
- Conditional render removes component

---

## TEST SCENARIO 6: Memory Management & Cleanup

### Objective
Verify no memory leaks from intervals

### Test Steps
1. Open DevTools Performance tab
2. Record 30 seconds
3. Click "Lihat Peta" multiple times rapidly
4. Click different regions in succession
5. Stop recording

### Expected Results
- ✅ Heap size stable (no continuous increase)
- ✅ Intervals cleaned up properly
- ✅ No duplicate intervals running
- ✅ No console warnings about memory

### Specific Check
```javascript
// In useEffect cleanup
return () => clearInterval(interval);  // ← Should fire on unmount

// In navigation useEffect cleanup
return () => clearTimeout(timer);      // ← Should fire on params change
```

---

## TEST SCENARIO 7: Firebase Markers Integration

### Setup
1. Add test data to Firebase:
   ```
   points/
   ├─ test1: { name: "Marker 1", coordinates: "-7.77,110.39" }
   └─ test2: { name: "Marker 2", coordinates: "-7.89,110.36" }
   ```

### Expected
- ✅ Markers render as pins on map
- ✅ Markers clickable (tap for info)
- ✅ Markers coexist with polygons (no overlap issues)
- ✅ Marker info shows name & coordinates

---

## TEST SCENARIO 8: Edge Cases

### Edge Case 8.1: Rapid Tab Switching
**Steps:**
1. Click "Lihat Peta" in Tab 3
2. Immediately switch back to Tab 3 (before 5s timeout)
3. Click another region
4. Switch back to Tab 1

**Expected:**
- ✅ New region highlight activates
- ✅ Previous region stops blinking
- ✅ No visual glitches or crashes
- ✅ Info overlay updates to new region

### Edge Case 8.2: No Weather Data Available
**Steps:**
1. Go to Tab 3
2. If all regions show "Data Error"
3. Click any "Lihat Peta"
4. Go to Tab 1

**Expected:**
- ✅ Polygon still highlights red
- ✅ Info overlay shows temp as "-"
- ✅ No crash
- ✅ Error handled gracefully

### Edge Case 8.3: Web Platform
**Steps:**
1. Open app in browser (web platform)
2. Try to access Tab 1

**Expected:**
- ✅ Shows message: "Map view is not available on web"
- ✅ No native module errors
- ✅ FAB button visible for navigation fallback

### Edge Case 8.4: Network Disconnected
**Steps:**
1. Turn off WiFi/Mobile data
2. Start app (or refresh while offline)
3. Go to Tab 1

**Expected:**
- ✅ App doesn't crash
- ✅ Error handling activates
- ✅ Polygons show with fallback colors
- ✅ "Gagal ambil data" warning in console

---

## TEST SCENARIO 9: Multiple Regions Comparison

### Steps
1. Click "Lihat Peta" for Region A
2. Wait 5 seconds for auto-timeout
3. Immediately click "Lihat Peta" for Region B

### Verification
- ✅ Region A stops blinking
- ✅ Region B starts blinking
- ✅ Info overlay shows Region B data
- ✅ No lingering highlight on Region A

---

## TEST SCENARIO 10: Re-render Optimization

### Objective
Ensure component doesn't re-render unnecessarily

### Test with React DevTools Profiler
```javascript
1. Install React DevTools extension
2. Open Profiler tab
3. Interact with map
4. Check render frequency

Expected:
- Component renders only when:
  ✅ params change (from Tab 3)
  ✅ weatherData updates (API response)
  ✅ isBlinking state toggles (animation)
  
- Component should NOT render on:
  ❌ User pan/zoom map (MapView self-contained)
  ❌ Marker position updates (independent component)
```

---

## CONSOLE LOGGING CHECKLIST

When testing, check console for these messages:

### Normal Operation
```
✅ "React Compiler enabled"
✅ "Starting Metro Bundler"
✅ Weather fetch logs (or errors)
✅ Navigation logs
```

### Errors to Watch For
```
❌ "react-native-maps not available" (unexpected on native)
❌ "Invalid coordinates" (bad data parsing)
❌ "Gagal ambil data" (expected on network issues)
❌ Memory leak warnings (should not appear)
❌ Unhandled promise rejection (should be caught)
```

---

## PERFORMANCE BENCHMARKS

### Expected Metrics
| Operation | Expected Time | Status |
|-----------|---------------|--------|
| Initial render | < 2s | Measure |
| Animation to region | 1s exactly | Check |
| Blink cycle | 500ms per toggle | Verify |
| Info overlay appear | < 100ms | Check |
| Auto-timeout | 5s exactly | Time |
| Memory after 10 cycles | < 2% increase | Monitor |

---

## MANUAL TEST CHECKLIST

### Before Deployment
- [ ] MapView renders with 5 polygons
- [ ] Polygon colors correct per weather
- [ ] Tab 3 → Tab 1 navigation smooth
- [ ] Highlight animation blinking visible
- [ ] Info overlay displays correct data
- [ ] Auto-timeout at 5s works
- [ ] Firebase markers visible
- [ ] No console errors
- [ ] No memory leaks (profiler check)
- [ ] Works on multiple devices/emulators
- [ ] All edge cases pass

---

## DEBUGGING TIPS

### If Polygons Not Rendering
```javascript
// Check 1: Verify DATA_DIY imported
import { DATA_DIY } from '../../constants/jogjaData';
console.log('DATA_DIY:', DATA_DIY);  // Should show 5 regions

// Check 2: Verify Polygon component
console.log('Polygon component:', Polygon);  // Should not be undefined

// Check 3: Check MapView ref
console.log('Map ref:', mapRef.current);  // Should reference MapView
```

### If Colors Not Changing
```javascript
// Check 1: Verify weatherData fetch
console.log('weatherData:', weatherData);  // Should have 5 items

// Check 2: Test getPolygonColor() logic
const testColor = getPolygonColor('sleman', false);
console.log('Color for Sleman:', testColor);

// Check 3: Verify weather description matching
weatherData.forEach(w => {
  console.log(`${w.name}: ${w.weatherDesc}`);
});
```

### If Animation Not Smooth
```javascript
// Check 1: Verify ref
if (!mapRef.current) console.warn('Map ref null!');

// Check 2: Check animation params
mapRef.current.animateToRegion({
  latitude: -7.77,
  longitude: 110.39,
  latitudeDelta: 0.08,  // Too small → jerky
  longitudeDelta: 0.08
}, 1000);

// Check 3: Test on real device (emulator may be slower)
```

---

## TEST REPORT TEMPLATE

```markdown
## Test Report - Tab 1 (Peta Radar)

**Date:** [Date]
**Tester:** [Name]
**Device:** [Device/Emulator]
**Build Version:** [Version]

### Test Results

#### Scenario 1: Map Rendering
- [ ] PASS
- [ ] FAIL
- [ ] PARTIAL
Issue: _____________

#### Scenario 2: Weather Color Mapping
- [ ] PASS
- [ ] FAIL
- [ ] PARTIAL
Issue: _____________

#### Scenario 3: Navigation & Animation
- [ ] PASS
- [ ] FAIL
- [ ] PARTIAL
Issue: _____________

#### Scenario 4: Blinking Effect
- [ ] PASS
- [ ] FAIL
- [ ] PARTIAL
Issue: _____________

#### Scenario 5: Info Overlay
- [ ] PASS
- [ ] FAIL
- [ ] PARTIAL
Issue: _____________

### Overall Status
- [ ] ALL PASS ✅
- [ ] SOME ISSUES ⚠️
- [ ] CRITICAL ISSUES ❌

### Notes
_________________________________________________
```

---

## Next: Integration Testing

After unit tests pass, proceed with:
1. End-to-end Tab 3 → Tab 1 flow
2. Multi-user/device synchronization
3. Production environment testing
4. Performance profiling on low-end devices

---

**Last Updated:** 2025-12-04
**Status:** Ready for Testing

