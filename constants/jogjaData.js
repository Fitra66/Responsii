// Data Master Poligon DIY (5 Kabupaten/Kota)
// Menggunakan kode BMKG yang TERBUKTI VALID (Status 200 OK dari testing)
// Setiap kode sudah di-test dan berhasil ambil data dari API BMKG

export const DATA_DIY = [
  {
    id: 'kota_jogja',
    name: 'Kota Yogyakarta',
    // Gunakan kode Sleman (34.04.11.2003) sebagai proxy untuk Kota Yogyakarta
    // Karena Kota Yogyakarta belum punya kode spesifik yang valid
    bmkgCode: '34.04.11.2003',
    color: 'rgba(255, 0, 0, 0.3)',
    center: { latitude: -7.8014, longitude: 110.3647 },
    coordinates: [
      { latitude: -7.7987846, longitude: 110.3520133 },
      { latitude: -7.7663164, longitude: 110.3612218 },
      { latitude: -7.7902403, longitude: 110.3980559 },
      { latitude: -7.8380882, longitude: 110.3934516 },
      { latitude: -7.8295439, longitude: 110.3566176 },
      { latitude: -7.7987846, longitude: 110.3520133 }
    ]
  },
  {
    id: 'sleman',
    name: 'Kabupaten Sleman',
    // ✅ VALID - Tested & Working (Status 200 OK)
    bmkgCode: '34.04.11.2003',
    color: 'rgba(0, 255, 0, 0.3)',
    center: { latitude: -7.77, longitude: 110.39 },
    coordinates: [
      { latitude: -7.8175819, longitude: 110.2415111 },
      { latitude: -7.7406836, longitude: 110.2276984 },
      { latitude: -7.6979623, longitude: 110.2783452 },
      { latitude: -7.6552409, longitude: 110.3059708 },
      { latitude: -7.5424567, longitude: 110.4487027 },
      { latitude: -7.5441655, longitude: 110.453307 },
      { latitude: -7.7663164, longitude: 110.4947453 },
      { latitude: -7.793658, longitude: 110.5407879 },
      { latitude: -7.8192908, longitude: 110.5453921 },
      { latitude: -7.8380882, longitude: 110.5039538 },
      { latitude: -7.8227085, longitude: 110.4901411 },
      { latitude: -7.8312528, longitude: 110.4302857 },
      { latitude: -7.7919492, longitude: 110.4210772 },
      { latitude: -7.7902403, longitude: 110.3980559 },
      { latitude: -7.7663164, longitude: 110.3612218 },
      { latitude: -7.7987846, longitude: 110.3520133 },
      { latitude: -7.8312528, longitude: 110.3013665 },
      { latitude: -7.7885315, longitude: 110.2875537 },
      { latitude: -7.8175819, longitude: 110.2415111 }
    ]
  },
  {
    id: 'bantul',
    name: 'Kabupaten Bantul',
    // ✅ VALID - Tested & Working (Status 200 OK)
    bmkgCode: '34.02.16.2001',
    color: 'rgba(0, 0, 255, 0.3)',
    center: { latitude: -7.89, longitude: 110.36 },
    coordinates: [
      { latitude: -7.9816318, longitude: 110.2092813 },
      { latitude: -7.9166954, longitude: 110.2829495 },
      { latitude: -7.8893538, longitude: 110.2829495 },
      { latitude: -7.839797, longitude: 110.2323026 },
      { latitude: -7.8175819, longitude: 110.2415111 },
      { latitude: -7.7885315, longitude: 110.2875537 },
      { latitude: -7.8312528, longitude: 110.3013665 },
      { latitude: -7.7987846, longitude: 110.3520133 },
      { latitude: -7.8295439, longitude: 110.3566176 },
      { latitude: -7.8380882, longitude: 110.3934516 },
      { latitude: -7.7902403, longitude: 110.3980559 },
      { latitude: -7.7919492, longitude: 110.4210772 },
      { latitude: -7.8312528, longitude: 110.4302857 },
      { latitude: -7.8227085, longitude: 110.4901411 },
      { latitude: -7.8380882, longitude: 110.5039538 },
      { latitude: -7.8705564, longitude: 110.4671198 },
      { latitude: -7.9047334, longitude: 110.4947453 },
      { latitude: -7.9696698, longitude: 110.471724 },
      { latitude: -7.9782141, longitude: 110.3612218 },
      { latitude: -8.0004292, longitude: 110.3335963 },
      { latitude: -8.0277708, longitude: 110.3382006 },
      { latitude: -7.9816318, longitude: 110.2092813 }
    ]
  },
  {
    id: 'kulon_progo',
    name: 'Kabupaten Kulon Progo',
    // ✅ VALID - Tested & Working (Status 200 OK)
    bmkgCode: '34.01.02.2001',
    color: 'rgba(255, 165, 0, 0.3)',
    center: { latitude: -7.82, longitude: 110.15 },
    coordinates: [
      { latitude: -7.6501144, longitude: 110.1402175 },
      { latitude: -7.6466967, longitude: 110.2645324 },
      { latitude: -7.6979623, longitude: 110.2783452 },
      { latitude: -7.7406836, longitude: 110.2276984 },
      { latitude: -7.8175819, longitude: 110.2415111 },
      { latitude: -7.839797, longitude: 110.2323026 },
      { latitude: -7.8893538, longitude: 110.2829495 },
      { latitude: -7.9166954, longitude: 110.2829495 },
      { latitude: -7.9816318, longitude: 110.2092813 },
      { latitude: -7.8893538, longitude: 110.0343196 },
      { latitude: -7.8141642, longitude: 110.0619451 },
      { latitude: -7.7458101, longitude: 110.131009 },
      { latitude: -7.6911268, longitude: 110.1356132 },
      { latitude: -7.6740383, longitude: 110.1171962 },
      { latitude: -7.6501144, longitude: 110.1402175 }
    ]
  },
  {
    id: 'gunung_kidul',
    name: 'Kabupaten Gunung Kidul',
    // ✅ VALID - Tested & Working (Status 200 OK)
    bmkgCode: '34.03.11.2001',
    color: 'rgba(128, 0, 128, 0.3)',
    center: { latitude: -8.0, longitude: 110.6 },
    coordinates: [
      { latitude: -8.0277708, longitude: 110.3382006 },
      { latitude: -8.0004292, longitude: 110.3335963 },
      { latitude: -7.9782141, longitude: 110.3612218 },
      { latitude: -7.9696698, longitude: 110.471724 },
      { latitude: -7.9047334, longitude: 110.4947453 },
      { latitude: -7.8705564, longitude: 110.4671198 },
      { latitude: -7.8380882, longitude: 110.5039538 },
      { latitude: -7.8192908, longitude: 110.5453921 },
      { latitude: -7.793658, longitude: 110.5407879 },
      { latitude: -7.781696, longitude: 110.5638092 },
      { latitude: -7.8073288, longitude: 110.5914347 },
      { latitude: -7.8039111, longitude: 110.6604986 },
      { latitude: -7.7885315, longitude: 110.6743114 },
      { latitude: -7.8073288, longitude: 110.6927284 },
      { latitude: -7.7919492, longitude: 110.7157497 },
      { latitude: -7.8244174, longitude: 110.757188 },
      { latitude: -7.8175819, longitude: 110.7848135 },
      { latitude: -8.0192266, longitude: 110.757188 },
      { latitude: -8.1508082, longitude: 110.7848135 },
      { latitude: -8.1610614, longitude: 110.7986263 },
      { latitude: -8.1371374, longitude: 110.8262519 },
      { latitude: -8.1730233, longitude: 110.8170433 },
      { latitude: -8.1730233, longitude: 110.8354604 },
      { latitude: -8.2037827, longitude: 110.8354604 },
      { latitude: -8.200365, longitude: 110.7065412 },
      { latitude: -8.1849853, longitude: 110.7065412 },
      { latitude: -8.072201, longitude: 110.3750346 },
      { latitude: -8.0277708, longitude: 110.3382006 }
    ]
  }
];
