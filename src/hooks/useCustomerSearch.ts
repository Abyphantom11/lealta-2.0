// Mock hook para testing
export function useCustomerSearch() {
  return {
    customers: [],
    searchTerm: '',
    setSearchTerm: () => {},
    isSearching: false,
    error: null
  };
}
