import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";

// Product interface
interface Product {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  thumbnail: string;
  brand: string;
  category: string;
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Fetch featured products and categories
    const fetchData = async () => {
      try {
        // Fetch featured products (we'll use dummy JSON API)
        const productsResponse = await fetch('https://dummyjson.com/products?limit=8');
        const productsData = await productsResponse.json();
        setFeaturedProducts(productsData.products);
        
        // Use hardcoded categories instead of relying on API
        const hardcodedCategories = [
          'smartphones',
          'laptops',
          'fragrances',
          'skincare',
          'groceries',
          'home-decoration'
        ];
        
        setCategories(hardcodedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">Shop the Latest Products</h1>
              <p className="text-xl mb-8 opacity-90">Discover amazing deals on electronics, fashion, home goods and more.</p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  onClick={() => setLocation('/products')}
                  className="px-8 py-3 bg-white text-primary hover:bg-gray-100"
                  size="lg"
                >
                  Shop Now
                </Button>
                <Button 
                  onClick={() => setLocation('/categories')}
                  variant="outline"
                  className="px-8 py-3 border-white text-white hover:bg-white/10"
                  size="lg"
                >
                  Browse Categories
                </Button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 right-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="relative">
                  <img 
                    src="https://i.dummyjson.com/data/products/7/thumbnail.jpg" 
                    alt="Featured Product"
                    className="rounded-lg shadow-2xl w-full max-w-lg object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our wide selection of products across popular categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer"
                onClick={() => setLocation(`/products?category=${category}`)}
              >
                <div className="aspect-square bg-gray-200 flex items-center justify-center p-6">
                  <span className="text-3xl">
                    {category === 'smartphones' && '📱'}
                    {category === 'laptops' && '💻'}
                    {category === 'fragrances' && '🧴'}
                    {category === 'skincare' && '✨'}
                    {category === 'groceries' && '🛒'}
                    {category === 'home-decoration' && '🏠'}
                    {category !== 'smartphones' && 
                     category !== 'laptops' && 
                     category !== 'fragrances' && 
                     category !== 'skincare' && 
                     category !== 'groceries' && 
                     category !== 'home-decoration' && '🛍️'}
                  </span>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium capitalize">{typeof category === 'string' ? category.replace('-', ' ') : category}</h3>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Button 
              onClick={() => setLocation('/products')}
              variant="outline"
            >
              View All Categories
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our handpicked selection of the best products
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div 
                key={product.id}
                className="product-card cursor-pointer"
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
                  <div className="flex items-center justify-between mt-2">
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
          
          <div className="text-center mt-10">
            <Button 
              onClick={() => setLocation('/products')}
            >
              Shop All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Join Our Newsletter</h2>
              <p className="text-gray-300 mb-8">
                Subscribe to our newsletter and be the first to know about new products, 
                special offers, and exclusive deals.
              </p>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="px-4 py-3 rounded-md flex-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button>Subscribe</Button>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;