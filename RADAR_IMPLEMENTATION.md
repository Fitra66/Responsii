# Tab 1 (Peta Radar) - Implementation Guide

## 🎯 Overview
Tab 1 (index.tsx) adalah fitur utama yang menampilkan peta radar cuaca wilayah DIY dengan sistem interaksi real-time dari Tab 3.

---

## ✨ Fitur Utama

### 1. **Poligon Wilayah Dinamis** (5 Kabupaten/Kota)
- Menampilkan 5 wilayah DIY dengan koordinat poligon dari `DATA_DIY`
- Warna berubah berdasarkan kondisi cuaca:
  - 🔵 **Biru**: Hujan/Gerimis
  - 🟡 **Kuning**: Cerah
  - ⚫ **Abu-abu**: Berawan/Mendung
  - ⚪ **Default**: Transparan

### 2. **Interaksi dari Tab 3 (Info Cuaca)**
Saat user klik tombol "Lihat di Peta Radar" di Tab 3:

**Alur Kerja:**
```
Tab 3 (Info Cuaca)
  ↓ User click "Lihat di Peta Radar"
  ↓ router.push() dengan params
Tab 1 (Peta Radar)
  ↓ useLocalSearchParams() menangkap data
  ↓ MapView animateToRegion() → zoom ke lokasi
  ↓ Poligon mulai berkedip merah (blinking effect)
```

**Params yang dikirim dari Tab 3:**
```javascript
{
  lat: -7.77,              // Latitude center wilayah
  long: 110.39,            // Longitude center wilayah
  highlightId: 'sleman'    // ID wilayah untuk di-highlight
}
```

### 3. **Blinking Animation Radar Effect** ⚡
- Ketika wilayah di-highlight, poligonnya berkedip merah
- Interval: 500ms (on/off)
- Auto-matikan setelah 5 detik
- Transparansi berfluktuasi antara 50% dan 10%

### 4. **Info Overlay Widget**
Saat poligon highlight, tampil informasi di top-left:
- 📍 **Nama Wilayah**
- 🌤️ **Deskripsi Cuaca**
- 🌡️ **Suhu**

---

## 🔧 Komponen & Logic

### State Management
```typescript
const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
const [isBlinking, setIsBlinking] = useState(false);
const [weatherData, setWeatherData] = useState<any[]>([]);
const mapRef = useRef<any>(null);
```

### useEffect Hooks

**1. Fetch Firebase Markers**
```typescript
useEffect(() => {
  // Ambil data point dari Firebase realtime database
  // Parse koordinat dan render sebagai Marker di map
}, []);
```

**2. Fetch BMKG Weather Data**
```typescript
useEffect(() => {
  fetchAllWeatherData();  // Panggil saat component mount
}, []);
```

**3. Handle Navigation Params**
```typescript
useEffect(() => {
  if (params.lat && params.long) {
    // 1. Animasi camera ke lokasi
    mapRef.current.animateToRegion({...}, 1000);
    
    // 2. Set highlight region
    setActiveRegionId(params.highlightId);
    
    // 3. Auto-timeout 5 detik
    setTimeout(() => setActiveRegionId(null), 5000);
  }
}, [params]);
```

**4. Blinking Animation Loop**
```typescript
useEffect(() => {
  if (activeRegionId) {
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev);  // Toggle setiap 500ms
    }, 500);
    return () => clearInterval(interval);
  }
}, [activeRegionId]);
```

### Fungsi Kritis

**getPolygonColor(regionId, isHighlighted)**
- Menentukan warna fill dan stroke polygon
- Input:
  - `regionId`: ID wilayah
  - `isHighlighted`: Apakah sedang di-highlight?
- Output:
  ```javascript
  {
    fillColor: 'rgba(...)',
    strokeColor: 'rgba(...)',
    strokeWidth: number
  }
  ```

**Logic:**
1. Jika highlight: gunakan red + blinking effect
2. Else: cek kondisi cuaca dari `weatherData`
3. Map cuaca → warna:
   - Hujan/Gerimis → Biru
   - Cerah → Kuning
   - Berawan → Abu-abu

---

## 📡 Data Flow

### Dari Firebase
```
Firebase points/
  ├── point1: { name: "...", coordinates: "lat,long" }
  ├── point2: { ... }
  └── ...
```
→ Parse & Render sebagai `Marker`

### Dari BMKG API
```
GET https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=34.04.11.2003
→ JSON response dengan weather forecast
→ Extract: weather_desc, temperature, humidity
→ Store di state `weatherData`
→ Gunakan untuk color logic & overlay info
```

### Dari Constants
```
DATA_DIY (jogjaData.js)
  ├── id, name, bmkgCode
  ├── center: { lat, long }
  ├── coordinates: [ { lat, long }, ... ]  // Polygon vertices
  └── color: 'rgba(...)'
```

---

## 🎨 Visual Hierarchy

### MapView Layers (bottom → top)
```
1. MapView Base (OSM Map)
2. Polygons (filled dengan warna cuaca)
3. Markers (dari Firebase - pin location)
4. Info Overlay (conditional - top-left)
5. FAB Button (top-right)
```

### Polygon Visual States

| State | fillColor | strokeColor | strokeWidth |
|-------|-----------|-------------|------------|
| Highlight (blink on) | `rgba(255,0,0,0.5)` | `rgba(255,0,0,1)` | 3 |
| Highlight (blink off) | `rgba(255,0,0,0.1)` | `rgba(255,0,0,1)` | 3 |
| Rain | `rgba(0,100,200,0.4)` | `rgba(0,0,0,0.2)` | 1 |
| Sunny | `rgba(255,200,0,0.3)` | `rgba(0,0,0,0.2)` | 1 |
| Cloudy | `rgba(150,150,150,0.3)` | `rgba(0,0,0,0.2)` | 1 |
| Default | `rgba(0,0,0,0.05)` | `rgba(0,0,0,0.2)` | 1 |

---

## 🧪 Testing Checklist

### Unit Test
- [ ] `getPolygonColor()` return correct RGBA values
- [ ] Weather keyword matching (hujan, cerah, berawan)
- [ ] Blinking interval updates state correctly

### Integration Test
- [ ] Tab 3 → click "Lihat di Peta" → Tab 1 animasi camera
- [ ] Polygon highlight berkedip 5 detik
- [ ] Info overlay tampil dengan data cuaca correct
- [ ] Auto-timeout matikan highlight setelah 5 detik
- [ ] Firebase markers render correctly
- [ ] BMKG API data fetch & display

### Manual Test (Device/Emulator)
1. Buka app di Expo Go
2. Navigasi ke Tab 1 (Radar)
3. Verifikasi:
   - Peta tampil dengan 5 polygon DIY
   - Warna polygon sesuai cuaca
   - Click Tab 3 → "Lihat di Peta" → Peta zoom & highlight
4. Check console logs untuk API errors

---

## ⚠️ Known Issues & Fixes

### Issue 1: Web Platform Not Supported
**Fix**: Already implemented dengan Platform.OS check
```typescript
if (Platform.OS !== 'web') {
  // Import react-native-maps hanya di native
}
```

### Issue 2: BMKG API Timeout
**Handling**: Promise.all() dengan error catching
- Fallback ke `weatherDesc: 'Error'` jika fetch fail

### Issue 3: Memory Leak dari Interval
**Fix**: Cleanup function di useEffect
```typescript
return () => clearInterval(interval);
```

---

## 🚀 Performance Optimization

1. **Memoization** (Future improvement)
   - Wrap `getPolygonColor` dengan `useMemo`
   - Prevent re-render jika params tidak berubah

2. **Data Caching**
   - BMKG data refresh setiap 5 menit (bisa ditambah)
   - Firebase markers realtime (sudah optimal)

3. **Map Performance**
   - Polygon count: 5 wilayah (lightweight)
   - Marker count: variable (firebase points)

---

## 📚 Related Files

- **Main**: `app/(tabs)/index.tsx`
- **Data**: `constants/jogjaData.js`
- **Sender Tab**: `app/(tabs)/infocuaca.tsx`
- **Types**: Inline interfaces

---

## 🔄 Future Enhancements

- [ ] Click polygon untuk show info (bukan hanya dari Tab 3)
- [ ] Weather animation (rain drops, clouds movement)
- [ ] Real-time data refresh indicator
- [ ] Custom markers dengan weather icons
- [ ] Heatmap visualization untuk temp
- [ ] AR overlay untuk weather visualization

