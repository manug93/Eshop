import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";

// Product interface
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

// Category interface
interface Category {
  name: string;
  count: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Fetch products and categories
    const fetchData = async () => {
      try {
        // Fetch all products
        const productsResponse = await fetch('https://dummyjson.com/products?limit=100');
        const productsData = await productsResponse.json();
        setProducts(productsData.products);

        // Fetch categories
        const categoriesResponse = await fetch('https://dummyjson.com/products/categories');
        const categoriesData = await categoriesResponse.json();
        
        // Create categories with count
        const categoriesWithCount = categoriesData.map((category: string) => {
          const count = productsData.products.filter(
            (product: Product) => product.category === category
          ).length;
          return { name: category, count };
        });
        setCategories(categoriesWithCount);

        // Extract unique brands
        const brandSet = new Set<string>();
        productsData.products.forEach((product: Product) => {
          brandSet.add(product.brand);
        });
        const uniqueBrands = Array.from(brandSet);
        setBrands(uniqueBrands.sort());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on selected filters
  const filteredProducts = products.filter((product) => {
    // Filter by category
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }

    // Filter by brand
    if (selectedBrand && product.brand !== selectedBrand) {
      return false;
    }

    // Filter by price range
    const finalPrice = product.price * (1 - product.discountPercentage / 100);
    if (finalPrice < priceRange[0] || finalPrice > priceRange[1]) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'priceLowHigh':
        return (a.price * (1 - a.discountPercentage / 100)) - (b.price * (1 - b.discountPercentage / 100));
      case 'priceHighLow':
        return (b.price * (1 - b.discountPercentage / 100)) - (a.price * (1 - a.discountPercentage / 100));
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setPriceRange([0, 2000]);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Products</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {sortedProducts.length} of {products.length} products
            </p>
            <div className="flex items-center space-x-4">
              <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-md p-2 text-sm"
              >
                <option value="recommended">Recommended</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  Clear all
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.name} className="flex items-center">
                      <input
                        type="radio"
                        id={`category-${category.name}`}
                        name="category"
                        checked={selectedCategory === category.name}
                        onChange={() => setSelectedCategory(category.name)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`category-${category.name}`} className="ml-2 text-sm text-gray-600">
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)} ({category.count})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">${priceRange[0]}</span>
                  <span className="text-sm text-gray-500">${priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Brands */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Brands</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <div key={brand} className="flex items-center">
                      <input
                        type="radio"
                        id={`brand-${brand}`}
                        name="brand"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(brand)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`brand-${brand}`} className="ml-2 text-sm text-gray-600">
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            {/* Mobile Filters Toggle */}
            <div className="lg:hidden mb-4">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 8a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm0 8a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1z" />
                </svg>
                Filters
              </Button>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m0 16v1m-9-9h1m16 0h1M5.05 5.05l.707.707M18.243 5.757l-.707.707M5.05 18.243l.707-.707M18.243 18.95l-.707-.707" />
                </svg>
                <h2 className="text-xl font-medium mb-2">No products found</h2>
                <p className="text-gray-600 mb-6">
                  Try different filters or browse all products
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => setLocation(`/products/${product.id}`)}
                  >
                    <div className="product-card-image">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        loading="lazy"
                      />
                    </div>
                    <div className="product-card-content">
                      <h3 className="product-card-title">{product.title}</h3>
                      <p className="product-card-brand">{product.brand}</p>
                      <div className="flex items-center mb-2">
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {product.discountPercentage > 0 ? (
                            <>
                              <span className="product-price">
                                ${(product.price * (1 - product.discountPercentage / 100)).toFixed(2)}
                              </span>
                              <span className="product-price-original">
                                ${product.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="product-price">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.discountPercentage > 0 && (
                          <span className="product-discount-badge">
                            {Math.round(product.discountPercentage)}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;