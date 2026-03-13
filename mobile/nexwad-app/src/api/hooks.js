import { useState, useEffect, useCallback } from "react";
import api from "./client";

// Generic fetch hook
export function useFetch(fetcher, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Listings feed
export function useListings(params = {}) {
  return useFetch(() => api.listings.list(params), [JSON.stringify(params)]);
}

// Single listing
export function useListing(id) {
  return useFetch(() => api.listings.get(id), [id]);
}

// Search
export function useSearch(query, params = {}) {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const search = useCallback(async (q, p = {}) => {
    if (!q?.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const { listings } = await api.listings.search({ q, ...p });
      setResults(listings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query, params), 400);
    return () => clearTimeout(timer);
  }, [query, JSON.stringify(params)]);

  return { results, loading, error, search };
}

// Notifications
export function useNotifications() {
  return useFetch(() => api.notifications.list(), []);
}

// Orders
export function useOrders(role = "buyer") {
  return useFetch(() => api.orders.list({ role }), [role]);
}

// Cart
export function useCart() {
  return useFetch(() => api.cart.list(), []);
}

// Saved listings
export function useSaved() {
  return useFetch(() => api.saved.listings.list(), []);
}

// Conversations
export function useConversations() {
  return useFetch(() => api.conversations.list(), []);
}

// Comments
export function useComments(listingId) {
  return useFetch(() => api.comments.list(listingId), [listingId]);
}

// Seller profile
export function useSeller(id) {
  return useFetch(() => api.sellers.get(id), [id]);
}
