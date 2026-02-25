import { algoliasearch } from "algoliasearch";

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || "";

const client = algoliasearch(APP_ID, SEARCH_KEY);

export const searchProducts = async (
  query: string = "",
  params: {
    page?: number;
    hitsPerPage?: number;
    filters?: string;
  } = {},
) => {
  const { page = 0, hitsPerPage = 20, filters = "" } = params;

  const result = await client.searchSingleIndex({
    indexName: "products_index",
    searchParams: {
      query,
      page,
      hitsPerPage,
      filters,
    },
  });

  return {
    hits: result.hits,
    nbHits: result.nbHits,
    page: result.page,
    nbPages: result.nbPages,
  };
};

export const searchOrders = async (
  query: string = "",
  params: {
    page?: number;
    hitsPerPage?: number;
    filters?: string;
  } = {},
) => {
  const { page = 0, hitsPerPage = 20, filters = "" } = params;

  const result = await client.searchSingleIndex({
    indexName: "orders_index",
    searchParams: {
      query,
      page,
      hitsPerPage,
      filters,
    },
  });

  return {
    hits: result.hits,
    nbHits: result.nbHits,
    page: result.page,
    nbPages: result.nbPages,
  };
};

export const searchStockInventory = async (
  query: string = "",
  params: {
    page?: number;
    hitsPerPage?: number;
    filters?: string;
  } = {},
) => {
  const { page = 0, hitsPerPage = 20, filters = "" } = params;

  const result = await client.searchSingleIndex({
    indexName: "stock_inventory_index",
    searchParams: {
      query,
      page,
      hitsPerPage,
      filters,
    },
  });

  return {
    hits: result.hits,
    nbHits: result.nbHits,
    page: result.page,
    nbPages: result.nbPages,
  };
};
