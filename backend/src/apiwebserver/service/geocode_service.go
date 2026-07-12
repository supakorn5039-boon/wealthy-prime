package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/wealthy-prime/backend/src/apperror"
)

const (
	geocodeMaxRedirects  = 10
	geocodeBodyLimit     = 1 << 20
	geocodeBrowserUA     = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	geocodeNominatimUA   = "WealthyPrimeEstate/1.0 (property listing admin)"
	geocodeDefaultNomURL = "https://nominatim.openstreetmap.org"
)

var (
	geocodePinRe   = regexp.MustCompile(`!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)`)
	geocodeAtRe    = regexp.MustCompile(`@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)`)
	geocodeQueryRe = regexp.MustCompile(`[?&](?:q|ll|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)`)
	googleHostRe   = regexp.MustCompile(`^(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$`)
)

type GeocodeResult struct {
	Found       bool     `json:"found"`
	Lat         *float64 `json:"lat,omitempty"`
	Lng         *float64 `json:"lng,omitempty"`
	ResolvedURL string   `json:"resolvedUrl,omitempty"`
	Source      string   `json:"source"`
}

type GeocodeService struct {
	expandTransport *http.Transport
	geocodeClient   *http.Client
	nominatimURL    string
	nominatimKey    string
}

func NewGeocodeService() *GeocodeService {
	transport := &http.Transport{
		DialContext:           guardedDialContext,
		TLSHandshakeTimeout:   5 * time.Second,
		ResponseHeaderTimeout: 6 * time.Second,
	}

	nomURL := strings.TrimRight(strings.TrimSpace(os.Getenv("NOMINATIM_URL")), "/")
	if nomURL == "" {
		nomURL = geocodeDefaultNomURL
	}

	return &GeocodeService{
		expandTransport: transport,
		geocodeClient:   &http.Client{Timeout: 10 * time.Second},
		nominatimURL:    nomURL,
		nominatimKey:    strings.TrimSpace(os.Getenv("NOMINATIM_KEY")),
	}
}

func (s *GeocodeService) ResolveMapURL(ctx context.Context, raw string) (*GeocodeResult, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, apperror.BadRequest("url is required")
	}

	parsed, err := url.Parse(raw)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return nil, apperror.BadRequest("invalid url")
	}
	if !isGoogleHost(parsed.Host) {
		return nil, apperror.BadRequest("only google maps links are supported")
	}

	if lat, lng, ok := parseCoordsFromURL(raw); ok {
		return foundResult(lat, lng, raw, "url"), nil
	}

	finalURL, hops, err := s.expand(ctx, raw)
	if err != nil {
		return nil, err
	}

	if lat, lng, matched, ok := firstCoordsFromURLs(append([]string{finalURL}, hops...)); ok {
		return foundResult(lat, lng, matched, "url"), nil
	}

	if address := addressFromMapURL(finalURL); address != "" {
		if lat, lng, ok := s.geocode(ctx, address); ok {
			return foundResult(lat, lng, finalURL, "geocode"), nil
		}
	}

	return &GeocodeResult{Found: false, ResolvedURL: finalURL, Source: "none"}, nil
}

func (s *GeocodeService) expand(ctx context.Context, raw string) (string, []string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	if err != nil {
		return "", nil, apperror.BadRequest("invalid url")
	}
	req.Header.Set("User-Agent", geocodeBrowserUA)
	req.Header.Set("Accept-Language", "en")

	hops := make([]string, 0, geocodeMaxRedirects)
	client := &http.Client{
		Timeout:   10 * time.Second,
		Transport: s.expandTransport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= geocodeMaxRedirects {
				return fmt.Errorf("too many redirects")
			}
			if !isGoogleHost(req.URL.Host) {
				return fmt.Errorf("redirect to disallowed host: %s", req.URL.Host)
			}
			hops = append(hops, req.URL.String())
			return nil
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		if resp != nil {
			resp.Body.Close()
		}
		return "", nil, apperror.Wrap(err, http.StatusBadGateway, "could not resolve map link")
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, geocodeBodyLimit))

	return resp.Request.URL.String(), hops, nil
}

func firstCoordsFromURLs(urls []string) (float64, float64, string, bool) {
	for _, candidate := range urls {
		if lat, lng, ok := parseCoordsFromURL(candidate); ok {
			return lat, lng, candidate, true
		}
	}
	return 0, 0, "", false
}

func (s *GeocodeService) geocode(ctx context.Context, address string) (float64, float64, bool) {
	for _, candidate := range geocodeCandidates(address) {
		if lat, lng, ok := s.geocodeOne(ctx, candidate); ok {
			return lat, lng, true
		}
	}
	return 0, 0, false
}

func (s *GeocodeService) geocodeOne(ctx context.Context, query string) (float64, float64, bool) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.nominatimURL+"/search", nil)
	if err != nil {
		return 0, 0, false
	}
	params := url.Values{}
	params.Set("format", "json")
	params.Set("limit", "1")
	params.Set("q", query)
	if s.nominatimKey != "" {
		params.Set("key", s.nominatimKey)
	}
	req.URL.RawQuery = params.Encode()
	req.Header.Set("User-Agent", geocodeNominatimUA)
	req.Header.Set("Accept-Language", "th,en")

	resp, err := s.geocodeClient.Do(req)
	if err != nil {
		return 0, 0, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, 0, false
	}

	var hits []struct {
		Lat string `json:"lat"`
		Lon string `json:"lon"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, geocodeBodyLimit)).Decode(&hits); err != nil || len(hits) == 0 {
		return 0, 0, false
	}
	return toCoords(hits[0].Lat, hits[0].Lon)
}

func geocodeCandidates(address string) []string {
	address = strings.TrimSpace(address)
	if address == "" {
		return nil
	}
	segments := strings.Split(address, ",")
	candidates := []string{address}
	if len(segments) >= 2 {
		if placeName := strings.TrimSpace(segments[0]); placeName != "" && placeName != address {
			candidates = append(candidates, placeName)
		}
	}
	if len(segments) >= 3 {
		trimmed := strings.TrimSpace(strings.Join(segments[1:], ","))
		if trimmed != "" && trimmed != address {
			candidates = append(candidates, trimmed)
		}
	}
	return candidates
}

func addressFromMapURL(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	query := parsed.Query()
	for _, key := range []string{"q", "query", "destination"} {
		value := strings.TrimSpace(query.Get(key))
		if value == "" {
			continue
		}
		if _, _, ok := toCoords2(value); ok {
			continue
		}
		return value
	}
	if name := placeNameFromPath(parsed.Path); name != "" {
		return name
	}
	return ""
}

func placeNameFromPath(path string) string {
	marker := "/maps/place/"
	idx := strings.Index(path, marker)
	if idx < 0 {
		return ""
	}
	rest := path[idx+len(marker):]
	if slash := strings.IndexByte(rest, '/'); slash >= 0 {
		rest = rest[:slash]
	}
	decoded, err := url.PathUnescape(rest)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(strings.ReplaceAll(decoded, "+", " "))
}

func parseCoordsFromURL(raw string) (float64, float64, bool) {
	if pins := geocodePinRe.FindAllStringSubmatch(raw, -1); len(pins) > 0 {
		last := pins[len(pins)-1]
		if lat, lng, ok := toCoords(last[1], last[2]); ok {
			return lat, lng, true
		}
	}
	if m := geocodeAtRe.FindStringSubmatch(raw); m != nil {
		if lat, lng, ok := toCoords(m[1], m[2]); ok {
			return lat, lng, true
		}
	}
	if m := geocodeQueryRe.FindStringSubmatch(raw); m != nil {
		if lat, lng, ok := toCoords(m[1], m[2]); ok {
			return lat, lng, true
		}
	}
	return 0, 0, false
}

func toCoords(latStr, lngStr string) (float64, float64, bool) {
	lat, errLat := strconv.ParseFloat(strings.TrimSpace(latStr), 64)
	lng, errLng := strconv.ParseFloat(strings.TrimSpace(lngStr), 64)
	if errLat != nil || errLng != nil {
		return 0, 0, false
	}
	if lat < -90 || lat > 90 || lng < -180 || lng > 180 {
		return 0, 0, false
	}
	return lat, lng, true
}

func toCoords2(value string) (float64, float64, bool) {
	parts := strings.SplitN(value, ",", 2)
	if len(parts) != 2 {
		return 0, 0, false
	}
	return toCoords(parts[0], parts[1])
}

func isGoogleHost(host string) bool {
	host = strings.ToLower(host)
	if h, _, err := net.SplitHostPort(host); err == nil {
		host = h
	}
	switch host {
	case "goo.gl", "g.co", "maps.app.goo.gl":
		return true
	}
	if host == "google.com" || strings.HasSuffix(host, ".google.com") {
		return true
	}
	return googleHostRe.MatchString(host)
}

func guardedDialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, err
	}
	ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	for _, ip := range ips {
		if isBlockedIP(ip.IP) {
			return nil, fmt.Errorf("blocked address: %s", ip.IP)
		}
	}
	dialer := net.Dialer{Timeout: 5 * time.Second}
	return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].IP.String(), port))
}

func isBlockedIP(ip net.IP) bool {
	return ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsUnspecified() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast()
}

func foundResult(lat, lng float64, resolvedURL, source string) *GeocodeResult {
	return &GeocodeResult{
		Found:       true,
		Lat:         &lat,
		Lng:         &lng,
		ResolvedURL: resolvedURL,
		Source:      source,
	}
}
