import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";

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
  const { t } = useTranslations();

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
      {/* Hero Section - Modern and Colorful */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 text-white py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-300 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-24 right-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          <div className="absolute -right-24 top-1/3 w-88 h-88 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 left-1/4 w-5 h-5 bg-white rounded-full opacity-50"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full opacity-60"></div>
          <div className="absolute bottom-1/4 left-1/5 w-4 h-4 bg-white rounded-full opacity-40"></div>
          <div className="absolute top-2/3 right-1/3 w-6 h-6 bg-white rounded-full opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="relative z-10">
              <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                {t.heroTitle}
                <span className="block mt-1 bg-gradient-to-r from-yellow-300 to-amber-400 text-transparent bg-clip-text">2025</span>
              </h1>
              <p className="text-xl mb-8 opacity-90 max-w-lg font-light">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  onClick={() => setLocation('/products')}
                  className="px-8 py-4 bg-white text-purple-600 hover:bg-gray-100 rounded-full shadow-lg transition-transform hover:scale-105"
                  size="lg"
                >
                  {t.shopNow}
                </Button>
                <Button 
                  onClick={() => setLocation('/categories')}
                  variant="outline"
                  className="px-8 py-4 border-white text-white hover:bg-white/10 rounded-full backdrop-blur-sm transition-transform hover:scale-105"
                  size="lg"
                >
                  {t.browseCategories}
                </Button>
              </div>
            </div>
            
            {/* Product Showcase */}
            <div className="mt-12 lg:mt-0 flex justify-center relative">
              <div className="relative transform transition-all">
                {/* Floating Card 1 */}
                <div className="absolute -top-10 -left-16 w-40 h-40 bg-white/10 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/20 transform rotate-12 animate-float-slow hidden md:block">
                  <div className="rounded-xl bg-indigo-100 h-full w-full overflow-hidden">
                    <img 
                      src="https://via.placeholder.com/150/3B82F6/FFFFFF?text=Phone" 
                      alt="Phone" 
                      className="object-cover h-full w-full"
                    />
                  </div>
                </div>
                
                {/* Main Product */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-white/20 overflow-hidden">
                  <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-pink-500 rounded-full opacity-30 blur-xl"></div>
                  <div className="relative rounded-2xl bg-white overflow-hidden h-64 w-64 md:h-80 md:w-80">
                    <img 
                      src="https://via.placeholder.com/300/9333EA/FFFFFF?text=Featured+Product" 
                      alt="Featured Product"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl p-2 text-white">
                      <div className="text-xs font-bold opacity-80">FEATURED PRODUCT</div>
                      <div className="text-sm truncate">Samsung Galaxy</div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Card 2 */}
                <div className="absolute -bottom-8 -right-12 w-36 h-36 bg-white/10 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/20 transform -rotate-6 animate-float hidden md:block">
                  <div className="rounded-xl bg-amber-50 h-full w-full overflow-hidden">
                    <img 
                      src="https://via.placeholder.com/150/F59E0B/FFFFFF?text=Laptop" 
                      alt="Laptop" 
                      className="object-cover h-full w-full"
                    />
                  </div>
                </div>
                
                {/* Decorative Badge */}
                <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full w-20 h-20 flex items-center justify-center shadow-lg hidden md:flex">
                  <div className="text-center font-bold text-sm text-white">
                    <div className="text-xl leading-none">20%</div>
                    <div className="text-xs leading-none">OFF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Modernized */}
      <section className="py-20 relative overflow-hidden">
        {/* Background and decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-40 h-40 bg-purple-400 rounded-full filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-300 rounded-full filter blur-3xl opacity-10"></div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">{t.shopByCategory}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              {t.shopByCategorySubtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => {
              // Define a color for each category
              const colors = [
                { bg: 'bg-gradient-to-br from-pink-500 to-rose-500', text: 'text-white' },
                { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', text: 'text-white' },
                { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-white' },
                { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-white' },
                { bg: 'bg-gradient-to-br from-purple-500 to-violet-600', text: 'text-white' },
                { bg: 'bg-gradient-to-br from-sky-400 to-cyan-500', text: 'text-white' },
              ];
              
              const colorIndex = index % colors.length;
              const { bg, text } = colors[colorIndex];
              
              return (
                <div 
                  key={index}
                  className="group relative bg-white rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  onClick={() => setLocation(`/products?category=${category}`)}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${bg}`}></div>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center p-6 relative z-10 transition-all group-hover:bg-opacity-10">
                    <span className="text-4xl transition-transform group-hover:scale-125 duration-300">
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
                  <div className="p-5 text-center relative z-10">
                    <h3 className={`font-medium capitalize transition-colors duration-300 group-hover:${text}`}>
                      {typeof category === 'string' ? category.replace('-', ' ') : category}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-14">
            <Button 
              onClick={() => setLocation('/products')}
              className="px-8 py-3 font-medium rounded-full bg-white text-gray-800 hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow transition-all"
            >
              {t.viewAllCategories}
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products - Modernized */}
      <section className="py-24 relative overflow-hidden">
        {/* Background and decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-white">
          <div className="absolute right-0 top-[30%] w-80 h-80 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="absolute -left-20 bottom-0 w-80 h-80 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
              {t.featuredProducts}
            </span>
            <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              {t.featuredProducts}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              {t.featuredProductsSubtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => {
              // Generate a consistent color based on product id
              const productColorIndex = product.id % 5;
              const productColors = [
                'from-blue-500 to-indigo-600',
                'from-violet-500 to-purple-600',
                'from-rose-500 to-pink-600',
                'from-amber-500 to-orange-600',
                'from-emerald-500 to-green-600'
              ];
              const productColor = productColors[productColorIndex];
              const textColor = product.id % 2 === 0 ? 'FFFFFF' : '000000';
              
              return (
                <div 
                  key={product.id}
                  className="group relative rounded-2xl bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation(`/products/${product.id}`)}
                >
                  {/* Product image with hover effect */}
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={`https://via.placeholder.com/400x300/${Math.floor(Math.random()*16777215).toString(16)}/${textColor}?text=Product+${product.id}`}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Discount badge */}
                    {product.discountPercentage > 0 && (
                      <div className={`absolute top-4 right-4 rounded-full bg-gradient-to-r ${productColor} text-white text-xs font-bold px-3 py-1.5 shadow-lg`}>
                        {Math.round(product.discountPercentage)}% OFF
                      </div>
                    )}
                    
                    {/* Quick action buttons that appear on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <Button className="bg-white hover:bg-gray-100 text-gray-900 rounded-full shadow-md px-6">
                          {t.addToCart}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product info */}
                  <div className="p-5">
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                      <h3 className="font-medium text-lg truncate">{product.title}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center">
                        {product.discountPercentage > 0 ? (
                          <>
                            <span className={`text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r ${productColor}`}>
                              ${(product.price * (1 - product.discountPercentage / 100)).toFixed(2)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className={`text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r ${productColor}`}>
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {/* Rating stars */}
                      <div className="flex items-center">
                        <span className="text-yellow-400 flex">
                          {'★'.repeat(Math.floor(4 + (product.id % 2)))}
                          {'☆'.repeat(5 - Math.floor(4 + (product.id % 2)))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-16">
            <Button 
              onClick={() => setLocation('/products')}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all px-8 py-3 rounded-full shadow-md hover:shadow-lg"
            >
              {t.viewAllProducts}
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action - Modernized */}
      <section className="py-20 relative overflow-hidden">
        {/* Background gradient and decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px] opacity-20"></div>
          <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-3000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Content container with glass effect */}
          <div className="rounded-2xl backdrop-blur-lg bg-white/10 p-8 md:p-12 shadow-xl border border-white/10">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t.newsletterTitle}</h2>
                <p className="text-gray-200 mb-8 text-lg font-light leading-relaxed">
                  {t.newsletterText}
                </p>
              </div>
              <div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="email" 
                    placeholder={t.emailPlaceholder} 
                    className="px-6 py-4 rounded-full flex-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white/90 placeholder:text-gray-500"
                  />
                  <Button 
                    className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all px-8 py-4 font-medium text-white"
                  >
                    {t.subscribeButton}
                  </Button>
                </div>
                <p className="text-gray-300 text-sm mt-4 ml-4">
                  {t.privacyText}
                </p>
              </div>
            </div>
          </div>
          
          {/* Decorative stars */}
          <div className="absolute top-12 left-1/4 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-36 right-1/3 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/2 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </section>
    </div>
  );
};

export default Home;