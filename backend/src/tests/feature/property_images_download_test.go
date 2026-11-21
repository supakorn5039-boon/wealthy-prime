package feature

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/controller"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

var imagesDownloadPaths = []string{"images-archive", "download"}

func newPropertyRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	controller.NewPropertyController().RegisterRoutes(r.Group("/api"))
	return r
}

func authHeaderFor(t *testing.T, id uint, role model.UserRole) string {
	t.Helper()
	config.App.Server.JWTSecret = "test-jwt-secret"
	security.InitJWT()
	token, err := security.GenerateJWT(id, role, fmt.Sprintf("%s@test.local", role))
	if err != nil {
		t.Fatalf("GenerateJWT: %v", err)
	}
	return "Bearer " + token
}

func getImagesDownload(r *gin.Engine, path, authHeader string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestPropertyImagesDownload_Access(t *testing.T) {
	r := newPropertyRouter()

	cases := []struct {
		name string
		id   string
		auth string
		want int
	}{
		{"no token", "1", "", http.StatusForbidden},
		{"malformed token", "1", "Bearer not-a-jwt", http.StatusForbidden},
		{"user", "1", authHeaderFor(t, 1, model.RoleUser), http.StatusForbidden},
		{"general agent", "1", authHeaderFor(t, 2, model.RoleGeneralAgent), http.StatusForbidden},
		{"agent with invalid id", "abc", authHeaderFor(t, 3, model.RoleAgent), http.StatusBadRequest},
		{"admin with invalid id", "abc", authHeaderFor(t, 4, model.RoleAdmin), http.StatusBadRequest},
	}

	for _, p := range imagesDownloadPaths {
		for _, tc := range cases {
			t.Run(p+"/"+tc.name, func(t *testing.T) {
				w := getImagesDownload(r, "/api/properties/"+tc.id+"/"+p, tc.auth)
				if w.Code != tc.want {
					t.Fatalf("got %d, want %d (body=%s)", w.Code, tc.want, w.Body.String())
				}
			})
		}
	}
}

func TestPropertyImagesDownload_Zip(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	prevDB, prevUploadDir := database.DB, config.App.Server.UploadDir
	database.DB = db
	config.App.Server.UploadDir = t.TempDir()
	defer func() {
		database.DB = prevDB
		config.App.Server.UploadDir = prevUploadDir
	}()

	files := map[string][]byte{
		"living-room.jpg": []byte("jpeg-bytes-living-room"),
		"bedroom.png":     []byte("png-bytes-bedroom"),
	}
	for name, data := range files {
		if err := os.WriteFile(filepath.Join(config.App.Server.UploadDir, name), data, 0o600); err != nil {
			t.Fatalf("write upload %s: %v", name, err)
		}
	}

	agentID := helpers.SeedAgent(t, db, "images.agent@test.local")
	adminID := helpers.SeedAdmin(t, db, "images.admin@test.local")

	withImages := helpers.NewProperty(agentID, "Images Condo", model.ListingRent, model.StatusAvailable)
	withImages.Images = []model.PropertyImage{
		{URL: "/uploads/living-room.jpg"},
		{URL: "/uploads/bedroom.png"},
		{URL: "/uploads/missing-on-disk.jpg"},
	}
	noImages := helpers.NewProperty(agentID, "Bare Condo", model.ListingRent, model.StatusAvailable)
	onlyMissing := helpers.NewProperty(agentID, "Broken Condo", model.ListingRent, model.StatusAvailable)
	onlyMissing.Images = []model.PropertyImage{{URL: "/uploads/gone.jpg"}}
	for _, p := range []*model.Property{&withImages, &noImages, &onlyMissing} {
		if err := db.Create(p).Error; err != nil {
			t.Fatalf("seed property %q: %v", p.ProjectName, err)
		}
	}
	if withImages.PropertyCode == "" {
		t.Fatal("seeded property has no property code")
	}

	r := newPropertyRouter()
	agentAuth := authHeaderFor(t, agentID, model.RoleAgent)
	adminAuth := authHeaderFor(t, adminID, model.RoleAdmin)

	for _, p := range imagesDownloadPaths {
		t.Run(p+"/agent gets a zip of every readable image", func(t *testing.T) {
			w := getImagesDownload(r, fmt.Sprintf("/api/properties/%d/%s", withImages.ID, p), agentAuth)
			if w.Code != http.StatusOK {
				t.Fatalf("got %d, want 200 (body=%s)", w.Code, w.Body.String())
			}
			if ct := w.Header().Get("Content-Type"); ct != "application/zip" {
				t.Errorf("Content-Type: got %q, want application/zip", ct)
			}
			wantDisposition := fmt.Sprintf("attachment; filename=%q", withImages.PropertyCode+"-images.zip")
			if cd := w.Header().Get("Content-Disposition"); cd != wantDisposition {
				t.Errorf("Content-Disposition: got %q, want %q", cd, wantDisposition)
			}

			zr, err := zip.NewReader(bytes.NewReader(w.Body.Bytes()), int64(w.Body.Len()))
			if err != nil {
				t.Fatalf("read zip: %v", err)
			}
			var gotContents []string
			for _, f := range zr.File {
				if !strings.HasPrefix(f.Name, "0") {
					t.Errorf("entry %q is not numbered", f.Name)
				}
				rc, err := f.Open()
				if err != nil {
					t.Fatalf("open entry %q: %v", f.Name, err)
				}
				data, err := io.ReadAll(rc)
				rc.Close()
				if err != nil {
					t.Fatalf("read entry %q: %v", f.Name, err)
				}
				gotContents = append(gotContents, string(data))
			}
			wantContents := []string{string(files["living-room.jpg"]), string(files["bedroom.png"])}
			slices.Sort(gotContents)
			slices.Sort(wantContents)
			if !slices.Equal(gotContents, wantContents) {
				t.Errorf("zip contents: got %q, want %q", gotContents, wantContents)
			}
		})

		t.Run(p+"/admin is allowed", func(t *testing.T) {
			w := getImagesDownload(r, fmt.Sprintf("/api/properties/%d/%s", withImages.ID, p), adminAuth)
			if w.Code != http.StatusOK {
				t.Fatalf("got %d, want 200 (body=%s)", w.Code, w.Body.String())
			}
		})

		notFound := []struct {
			name string
			id   uint
		}{
			{"property without images", noImages.ID},
			{"property whose images are all unreadable", onlyMissing.ID},
			{"unknown property", withImages.ID + 1000},
		}
		for _, tc := range notFound {
			t.Run(p+"/"+tc.name+" is 404", func(t *testing.T) {
				w := getImagesDownload(r, fmt.Sprintf("/api/properties/%d/%s", tc.id, p), agentAuth)
				if w.Code != http.StatusNotFound {
					t.Fatalf("got %d, want 404 (body=%s)", w.Code, w.Body.String())
				}
			})
		}
	}
}
