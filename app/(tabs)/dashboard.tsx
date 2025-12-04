import { FontAwesome } from '@expo/vector-icons';
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DATA_DIY } from '../../constants/jogjaData.js';
import { db } from '../../firebase';

interface WeatherData {
  id: string;
  name: string;
  bmkgCode: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  center: { latitude: number; longitude: number };
  color: string;
  weatherDesc: string;
  temp: string;
  humidity: string;
  icon: string | null;
  localTime: string;
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk Data
  const [totalReports, setTotalReports] = useState(0);
  const [rainCount, setRainCount] = useState(0);
  const [sunnyCount, setSunnyCount] = useState(0);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [kabupatenStats, setKabupatenStats] = useState<any[]>([]);
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);

  // Fungsi Fetch Data
  const fetchData = () => {
    const pointsRef = ref(db, 'points/');
    onValue(pointsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // 1. Hitung Total
        setTotalReports(parsedData.length);

        // 2. Hitung Cuaca (sesuai kategori yang ada)
        const rain = parsedData.filter(item => item.status === 'hujan').length;
        const sunny = parsedData.filter(item => item.status === 'tidak hujan').length;

        setRainCount(rain);
        setSunnyCount(sunny);

        // 3. Hitung Statistik per Kabupaten
        const kabupatenData = DATA_DIY.map(kabupaten => {
          const reportsInKabupaten = parsedData.filter(report => {
            // Asumsi koordinat disimpan sebagai string "lat,lng"
            if (!report.coordinates) return false;
            const [lat, lng] = report.coordinates.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) return false;

            // Simple point-in-polygon check (untuk demo)
            // Dalam implementasi nyata, gunakan library seperti turf.js
            return lat >= kabupaten.center.latitude - 0.1 &&
                   lat <= kabupaten.center.latitude + 0.1 &&
                   lng >= kabupaten.center.longitude - 0.1 &&
                   lng <= kabupaten.center.longitude + 0.1;
          });

          const rainCount = reportsInKabupaten.filter(r => r.status === 'hujan').length;
          const sunnyCount = reportsInKabupaten.filter(r => r.status === 'tidak hujan').length;
          const totalReports = reportsInKabupaten.length;

          return {
            ...kabupaten,
            totalReports,
            rainCount,
            sunnyCount,
            dominantWeather: rainCount > sunnyCount ? 'hujan' : 'tidak hujan'
          };
        });

        setKabupatenStats([kabupatenData[2]]); // Ambil data dari tab 3 saja (Bantul)

        // 4. Ambil 5 Laporan Terakhir (Sort by timestamp descending)
        // Asumsi ada field timestamp, jika tidak ada, ambil dari urutan array terakhir
        const sorted = parsedData.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }).slice(0, 5);

        setRecentReports(sorted);
      }
      setLoading(false);
      setRefreshing(false);
    });
  };

  // Fungsi Fetch Weather Data
  const fetchWeatherMassal = async () => {
    try {
      // 2. Teknik Promise.all untuk mengambil 5 data sekaligus secara paralel
      const promises = DATA_DIY.map(async (region) => {
        try {
          // Gunakan bmkgCode untuk API BMKG
          const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${region.bmkgCode}`;
          const response = await fetch(url);

          // Cek jika response BUKAN 200 OK (misal 404)
          if (!response.ok) {
            console.warn(`Gagal ambil data untuk ${region.name} (${response.status})`);
            return {
              ...region,
              weatherDesc: 'Data Error',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const json = await response.json();

          // Cek apakah data tersedia di dalam JSON
          if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
            console.warn(`Tidak ada data untuk ${region.name}:`, json);
            return {
              ...region,
              weatherDesc: 'Tidak ada data',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const locationData = json.data[0];
          if (!locationData.cuaca || !Array.isArray(locationData.cuaca) || locationData.cuaca.length === 0) {
            console.warn(`Tidak ada weather data untuk ${region.name}`);
            return {
              ...region,
              weatherDesc: 'Tidak ada prediksi',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const dayData = locationData.cuaca[0];
          if (!Array.isArray(dayData) || dayData.length === 0) {
            console.warn(`Tidak ada jam data untuk ${region.name}`);
            return {
              ...region,
              weatherDesc: 'Data jam kosong',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const current = dayData[0];

          // Fix URL Gambar (ganti spasi dengan %20)
          let iconUrl = current.image || 'https://via.placeholder.com/60';
          if (iconUrl && typeof iconUrl === 'string') {
            iconUrl = iconUrl.replace(/ /g, '%20');
          }

          return {
            ...region,
            weatherDesc: current.weather_desc || 'Tidak ada deskripsi',
            temp: current.t?.toString() || '-',
            humidity: current.hu?.toString() || '-',
            icon: iconUrl,
            localTime: current.local_datetime || new Date().toISOString(),
          };
        } catch (regionError) {
          console.error(`Error fetch ${region.name}:`, regionError);
          // Return fallback data jika error jaringan
          return {
            ...region,
            weatherDesc: 'Error Jaringan',
            temp: '-',
            humidity: '-',
            icon: null,
            localTime: new Date().toISOString(),
          };
        }
      });

      // Tunggu semua request selesai baru update state
      const results = await Promise.all(promises);
      setWeatherList(results.filter(Boolean) as WeatherData[]);
      setWeatherLoading(false);
    } catch (error) {
      console.error('Gagal ambil data:', error);
      // Set fallback data
      const fallbackData = DATA_DIY.map(region => ({
        ...region,
        weatherDesc: 'Tidak dapat terhubung',
        temp: '-',
        humidity: '-',
        icon: null,
        localTime: new Date().toISOString(),
      })) as WeatherData[];
      setWeatherList(fallbackData);
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWeatherMassal();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchWeatherMassal();
  };

  // Helper untuk format tanggal
  const formatDate = (isoString: string) => {
    if(!isoString) return 'Baru saja';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Hitung Persentase untuk Bar Visual
  const total = rainCount + sunnyCount;
  const rainPercent = total === 0 ? 0 : (rainCount / total) * 100;
  const sunnyPercent = total === 0 ? 0 : (sunnyCount / total) * 100;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.headerTitle}>Statistik Cuaca DIY</Text>
      <Text style={styles.subHeader}>Pantauan real-time dari kontributor</Text>

      {/* 1. KARTU RINGKASAN */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
          <FontAwesome name="cloud-upload" size={24} color="#0275d8" />
          <Text style={styles.cardValue}>{totalReports}</Text>
          <Text style={styles.cardLabel}>Total Laporan</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
          <FontAwesome name="tint" size={24} color="#28a745" />
          <Text style={styles.cardValue}>{rainCount}</Text>
          <Text style={styles.cardLabel}>Titik Hujan</Text>
        </View>
      </View>

      {/* 2. DOMINASI CUACA (Bar Chart Sederhana) */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Dominasi Cuaca Saat Ini</Text>

        <View style={styles.barContainer}>
          {/* Bar Hujan */}
          <View style={[styles.barSegment, { flex: rainPercent, backgroundColor: '#5D9CEC' }]}>
            {rainPercent > 15 && <Text style={styles.barText}>{Math.round(rainPercent)}%</Text>}
          </View>
          {/* Bar Cerah */}
          <View style={[styles.barSegment, { flex: sunnyPercent, backgroundColor: '#FFCE54' }]}>
            {sunnyPercent > 15 && <Text style={[styles.barText, {color: '#333'}]}>{Math.round(sunnyPercent)}%</Text>}
          </View>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#5D9CEC' }]} />
            <Text style={styles.legendText}>Hujan ({rainCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#FFCE54' }]} />
            <Text style={styles.legendText}>Cerah ({sunnyCount})</Text>
          </View>
        </View>
      </View>

      {/* 3. STATISTIK PER KABUPATEN */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Statistik per Kabupaten/Kota</Text>
        {kabupatenStats.map((kabupaten) => (
          <View key={kabupaten.id} style={styles.kabupatenItem}>
            <View style={styles.kabupatenHeader}>
              <View style={[styles.colorIndicator, { backgroundColor: kabupaten.color }]} />
              <Text style={styles.kabupatenName}>{kabupaten.name}</Text>
              <View style={[styles.weatherBadge, {
                backgroundColor: kabupaten.dominantWeather === 'hujan' ? '#5D9CEC' : '#FFCE54'
              }]}>
                <Text style={styles.weatherBadgeText}>
                  {kabupaten.dominantWeather === 'hujan' ? 'Hujan' : 'Cerah'}
                </Text>
              </View>
            </View>

            <View style={styles.kabupatenStats}>
              <View style={styles.statItem}>
                <FontAwesome name="cloud-upload" size={16} color="#666" />
                <Text style={styles.statValue}>{kabupaten.totalReports}</Text>
                <Text style={styles.statLabel}>Laporan</Text>
              </View>

              <View style={styles.statItem}>
                <FontAwesome name="tint" size={16} color="#28a745" />
                <Text style={styles.statValue}>{kabupaten.rainCount}</Text>
                <Text style={styles.statLabel}>Hujan</Text>
              </View>

              <View style={styles.statItem}>
                <FontAwesome name="sun-o" size={16} color="#FFA000" />
                <Text style={styles.statValue}>{kabupaten.sunnyCount}</Text>
                <Text style={styles.statLabel}>Cerah</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 4. FEED TERBARU */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Laporan Terbaru Masuk</Text>
        {recentReports.map((item, index) => (
          <View key={item.id || index} style={styles.logItem}>
            <View style={[styles.iconBox, { backgroundColor: item.status === 'hujan' ? '#E3F2FD' : '#FFF9C4' }]}>
              <FontAwesome
                name={item.status === 'hujan' ? 'tint' : 'sun-o'}
                size={20}
                color={item.status === 'hujan' ? '#0275d8' : '#FFA000'}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.logName}>{item.name}</Text>
              <Text style={styles.logTime}>{formatDate(item.timestamp)} • {item.accuration || 'Akurasi N/A'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'hujan' ? '#0275d8' : '#FFA000' }]}>
              <Text style={styles.statusText}>{item.status === 'hujan' ? 'Hujan' : 'Cerah'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{height: 30}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },

  // Cards
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  cardLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },

  // Section
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },

  // Bar Chart
  barContainer: {
    height: 30,
    flexDirection: 'row',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },

  // Log List
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  logTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  // Kabupaten Section
  kabupatenItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  kabupatenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  kabupatenName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  kabupatenStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
});
