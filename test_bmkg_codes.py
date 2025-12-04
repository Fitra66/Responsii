import requests
import json

print("=" * 60)
print("TESTING BMKG CODES FOR DIY REGIONS")
print("=" * 60)
print()

# Format codes to test
test_data = {
    "long_format": [
        {"region": "Kota Yogyakarta", "code": "34.71.03.1006"},
        {"region": "Kabupaten Sleman", "code": "34.04.11.2003"},
        {"region": "Kabupaten Bantul", "code": "34.02.16.2001"},
        {"region": "Kabupaten Kulon Progo", "code": "34.01.02.2001"},
        {"region": "Kabupaten Gunung Kidul", "code": "34.03.11.2001"}
    ],
    "short_format": [
        {"region": "Kota Yogyakarta", "code": "3471012"},
        {"region": "Kabupaten Sleman", "code": "3471011"},
        {"region": "Kabupaten Bantul", "code": "3471003"},
        {"region": "Kabupaten Kulon Progo", "code": "3471005"},
        {"region": "Kabupaten Gunung Kidul", "code": "3471004"}
    ]
}

valid_codes = []

# Test long format
print("TESTING LONG FORMAT (34.XX.XX.XXXX):")
print("-" * 60)
for item in test_data["long_format"]:
    url = f"https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={item['code']}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                print(f"✅ {item['region']}")
                print(f"   Code: {item['code']}")
                print(f"   Status: 200 OK ({len(data['data'])} records)")
                print(f"   URL: {url}")
                valid_codes.append({
                    "region": item['region'],
                    "code": item['code'],
                    "url": url
                })
            else:
                print(f"❌ {item['region']} - No data returned")
                print(f"   Code: {item['code']}")
                print(f"   Status: 200 OK (but empty data)")
        else:
            print(f"❌ {item['region']} - Status {response.status_code}")
            print(f"   Code: {item['code']}")
    except Exception as e:
        print(f"❌ {item['region']} - Error: {str(e)}")
        print(f"   Code: {item['code']}")
    print()

print()
print("TESTING SHORT FORMAT (3471012):")
print("-" * 60)
for item in test_data["short_format"]:
    url = f"https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={item['code']}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                print(f"✅ {item['region']}")
                print(f"   Code: {item['code']}")
                print(f"   Status: 200 OK ({len(data['data'])} records)")
                print(f"   URL: {url}")
                valid_codes.append({
                    "region": item['region'],
                    "code": item['code'],
                    "url": url
                })
            else:
                print(f"❌ {item['region']} - No data returned")
                print(f"   Code: {item['code']}")
                print(f"   Status: 200 OK (but empty data)")
        else:
            print(f"❌ {item['region']} - Status {response.status_code}")
            print(f"   Code: {item['code']}")
    except Exception as e:
        print(f"❌ {item['region']} - Error: {str(e)}")
        print(f"   Code: {item['code']}")
    print()

print()
print("=" * 60)
print("FINAL RESULTS - VALID CODES")
print("=" * 60)
print()

if valid_codes:
    for code in valid_codes:
        print(f"Wilayah: {code['region']}")
        print(f"Kode yang valid: {code['code']}")
        print(f"URL yang berhasil: {code['url']}")
        print(f"Status: ✅ OK")
        print()
else:
    print("⚠️  Tidak ada kode yang valid ditemukan.")
    print()
    print("Coba cek public locations di:")
    print("https://api.bmkg.go.id/publik/api-prakiraan-cuaca-harian")
