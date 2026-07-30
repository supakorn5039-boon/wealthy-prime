package controller

import (
	"reflect"
	"testing"
	"time"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/pkg/timezone"
)

func TestParseIntCSV(t *testing.T) {
	cases := []struct {
		in   string
		want []int32
	}{
		{"", nil},
		{"1", []int32{1}},
		{"1,2,3", []int32{1, 2, 3}},
		{" 1 , 2 ,3 ", []int32{1, 2, 3}},
		{"1,abc,3", []int32{1, 3}},
		{"0,-1,5", []int32{5}},
		{"abc", []int32{}},
	}
	for _, tc := range cases {
		if got := parseIntCSV(tc.in); !reflect.DeepEqual(got, tc.want) {
			t.Errorf("parseIntCSV(%q) = %v, want %v", tc.in, got, tc.want)
		}
	}
}

func TestParseStringCSV(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{"", nil},
		{"a", []string{"a"}},
		{"a,b,c", []string{"a", "b", "c"}},
		{" a , b , c ", []string{"a", "b", "c"}},
		{"a,,b", []string{"a", "b"}},
		{",,,", []string{}},
	}
	for _, tc := range cases {
		if got := parseStringCSV(tc.in); !reflect.DeepEqual(got, tc.want) {
			t.Errorf("parseStringCSV(%q) = %v, want %v", tc.in, got, tc.want)
		}
	}
}

func TestParsePriceRanges(t *testing.T) {
	f := func(v float64) *float64 { return &v }
	cases := []struct {
		in   string
		want []service.PriceRange
	}{
		{"", nil},
		{"100-500", []service.PriceRange{{Min: f(100), Max: f(500)}}},
		{"-500", []service.PriceRange{{Max: f(500)}}},
		{"100-", []service.PriceRange{{Min: f(100)}}},
		{"100-500,1000-2000", []service.PriceRange{{Min: f(100), Max: f(500)}, {Min: f(1000), Max: f(2000)}}},
		{"-", []service.PriceRange{}},
		{"abc-def", []service.PriceRange{}},
	}
	for _, tc := range cases {
		if got := parsePriceRanges(tc.in); !reflect.DeepEqual(got, tc.want) {
			t.Errorf("parsePriceRanges(%q) = %v, want %v", tc.in, got, tc.want)
		}
	}
}

func TestParseICTDate(t *testing.T) {
	if got := parseICTDate(""); got != nil {
		t.Errorf("empty string should yield nil, got %v", got)
	}
	if got := parseICTDate("not-a-date"); got != nil {
		t.Errorf("garbage should yield nil, got %v", got)
	}

	got := parseICTDate("2026-07-30")
	if got == nil {
		t.Fatal("valid date parsed to nil")
	}
	want := time.Date(2026, 7, 30, 0, 0, 0, 0, timezone.ICT)
	if !got.Equal(want) {
		t.Errorf("parseICTDate = %v, want %v", got, want)
	}
	if _, offset := got.Zone(); offset != 7*3600 {
		t.Errorf("expected ICT (+7h) offset, got %d seconds", offset)
	}
}

func TestParseICTDateEndIsExclusiveNextMidnight(t *testing.T) {
	if got := parseICTDateEnd(""); got != nil {
		t.Errorf("empty string should yield nil, got %v", got)
	}

	got := parseICTDateEnd("2026-07-30")
	if got == nil {
		t.Fatal("valid date parsed to nil")
	}
	want := time.Date(2026, 7, 31, 0, 0, 0, 0, timezone.ICT)
	if !got.Equal(want) {
		t.Errorf("parseICTDateEnd = %v, want %v", got, want)
	}

	lastMoment := time.Date(2026, 7, 30, 23, 59, 59, 0, timezone.ICT)
	if !lastMoment.Before(*got) {
		t.Error("23:59:59 on the selected day must fall inside the range")
	}
}
