import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../utils/helpers';

export const useApi = (apiFunc, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunc(...params);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
};

export const usePaginatedApi = (apiFunc, pageSize = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunc({ 
        page: pageNum, 
        page_size: pageSize 
      });
      
      if (reset) {
        setData(result.results || result);
      } else {
        setData(prev => [...prev, ...(result.results || result)]);
      }
      
      setTotal(result.count || result.length);
      setHasMore(!!result.next);
      setPage(pageNum);
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunc, pageSize]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchData(page + 1);
    }
  }, [loading, hasMore, page, fetchData]);

  const refresh = useCallback(() => {
    fetchData(1, true);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    page, 
    hasMore, 
    total,
    loadMore, 
    refresh,
    setData 
  };
};
