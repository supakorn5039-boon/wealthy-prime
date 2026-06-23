package controller

import (
	"testing"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
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
		got := parseIntCSV(tc.in)
		if !int32SliceEq(got, tc.want) {
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
		got := parseStringCSV(tc.in)
		if !stringSliceEq(got, tc.want) {
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
		{"-", nil},
		{"abc-def", nil},
	}
	for _, tc := range cases {
		got := parsePriceRanges(tc.in)
		if !priceRangeSliceEq(got, tc.want) {
			t.Errorf("parsePriceRanges(%q) = %v, want %v", tc.in, got, tc.want)
		}
	}
}

func int32SliceEq(a, b []int32) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func stringSliceEq(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func priceRangeSliceEq(a, b []service.PriceRange) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if !floatPtrEq(a[i].Min, b[i].Min) || !floatPtrEq(a[i].Max, b[i].Max) {
			return false
		}
	}
	return true
}

func floatPtrEq(a, b *float64) bool {
	if a == nil || b == nil {
		return a == b
	}
	return *a == *b
}
