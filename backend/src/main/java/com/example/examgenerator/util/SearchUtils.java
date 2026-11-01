package com.example.examgenerator.util;

public final class SearchUtils {

    private SearchUtils() {
    }

    /**
     * Normalizes search keywords similar to search engines:
     * - Trims leading and trailing whitespace
     * - Collapses multiple consecutive whitespace characters into a single space
     * - Returns null if the result is empty or whitespace-only, allowing database
     *   queries to safely bypass search filtering.
     *
     * @param search raw search string
     * @return normalized search keyword, or null if empty
     */
    public static String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String normalized = search.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }
}

