package service

import "testing"

func TestParseCoordsFromURL(t *testing.T) {
	cases := []struct {
		name    string
		url     string
		wantOK  bool
		wantLat float64
		wantLng float64
	}{
		{"pin data", "https://www.google.com/maps/place/X/@1,2,17z/data=!3d13.7437!4d100.4889", true, 13.7437, 100.4889},
		{"at center", "https://www.google.com/maps/@13.7563,100.5018,17z", true, 13.7563, 100.5018},
		{"q coords", "https://maps.google.com/?q=13.75,100.50", true, 13.75, 100.50},
		{"q address text", "https://www.google.com/maps?q=Wat+Arun,+Bangkok&ftid=0x30:0x86", false, 0, 0},
		{"out of range", "https://www.google.com/maps/@200,100,17z", false, 0, 0},
		{"no coords", "https://maps.app.goo.gl/abc", false, 0, 0},
	}
	for _, tc := range cases {
		lat, lng, ok := parseCoordsFromURL(tc.url)
		if ok != tc.wantOK {
			t.Errorf("%s: ok=%v want %v", tc.name, ok, tc.wantOK)
			continue
		}
		if ok && (lat != tc.wantLat || lng != tc.wantLng) {
			t.Errorf("%s: got %v,%v want %v,%v", tc.name, lat, lng, tc.wantLat, tc.wantLng)
		}
	}
}

func TestIsGoogleHost(t *testing.T) {
	allowed := []string{"maps.app.goo.gl", "goo.gl", "g.co", "google.com", "www.google.com", "maps.google.com", "google.co.th", "maps.google.co.uk"}
	for _, h := range allowed {
		if !isGoogleHost(h) {
			t.Errorf("expected %s allowed", h)
		}
	}
	blocked := []string{"169.254.169.254", "evil.com", "google.com.evil.com", "notgoogle.com", "localhost", "goo.gl.evil.com"}
	for _, h := range blocked {
		if isGoogleHost(h) {
			t.Errorf("expected %s blocked", h)
		}
	}
}

func TestGeocodeCandidates(t *testing.T) {
	got := geocodeCandidates("Wat Arun Ratchawararam, 158 Thanon Wang Doem, Wat Arun, Bangkok 10600")
	if len(got) != 3 {
		t.Fatalf("want 3 candidates, got %d: %v", len(got), got)
	}
	if got[0] != "Wat Arun Ratchawararam, 158 Thanon Wang Doem, Wat Arun, Bangkok 10600" {
		t.Errorf("first candidate should be the full address, got %q", got[0])
	}
	if got[1] != "Wat Arun Ratchawararam" {
		t.Errorf("second candidate should be the place name, got %q", got[1])
	}
	if got[2] != "158 Thanon Wang Doem, Wat Arun, Bangkok 10600" {
		t.Errorf("third candidate should be the street-and-area fallback, got %q", got[2])
	}
	if single := geocodeCandidates("Bangkok"); len(single) != 1 {
		t.Errorf("single-segment should yield 1 candidate, got %v", single)
	}
	twoSeg := geocodeCandidates("Hotel Picnic Bangkok, Bangkok")
	if len(twoSeg) != 2 || twoSeg[1] != "Hotel Picnic Bangkok" {
		t.Errorf("two-segment address should add the place name, got %v", twoSeg)
	}
}

func TestAddressFromMapURL(t *testing.T) {
	got := addressFromMapURL("https://www.google.com/maps?q=Wat+Arun,+Bangkok+10600&ftid=0x30:0x86&entry=gps")
	if got != "Wat Arun, Bangkok 10600" {
		t.Errorf("got %q", got)
	}
	if placeCoords := addressFromMapURL("https://maps.google.com/?q=13.75,100.50"); placeCoords != "" {
		t.Errorf("coord q should not be treated as address, got %q", placeCoords)
	}
	fromPath := addressFromMapURL("https://www.google.com/maps/place/Wat+Arun+Temple/data=!1s0x30")
	if fromPath != "Wat Arun Temple" {
		t.Errorf("path place: got %q", fromPath)
	}
}
