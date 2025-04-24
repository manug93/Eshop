import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "@/hooks/use-translations";

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

const ProductDetail = () => {
  const params = useParams();
  const productId = params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { t } = useTranslations();

  useEffect(() => {
    // Fetch product details
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the product
        const productResponse = await fetch(`https://dummyjson.com/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error('Product not found');
        }
        
        const productData = await productResponse.json();
        setProduct(productData);
        setSelectedImage(productData.thumbnail);

        // Fetch related products in the same category
        const categoryResponse = await fetch(`https://dummyjson.com/products/category/${productData.category}?limit=4`);
        const categoryData = await categoryResponse.json();
        
        // Filter out the current product and limit to 3 related products
        const related = categoryData.products
          .filter((item: Product) => item.id !== productData.id)
          .slice(0, 3);
        
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Use the addToCart function from useCart hook
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity
    });
    
    toast({
      title: t.itemAdded || "Added to Cart",
      description: `${product.title} has been added to your cart`,
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the product you're looking for.</p>
            <Button onClick={() => setLocation('/products')}>
              Browse All Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const finalPrice = product.price * (1 - product.discountPercentage / 100);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/" className="text-gray-500 hover:text-primary">Home</a>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <a href="/products" className="text-gray-500 hover:text-primary">Products</a>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <a 
                href={`/products/category/${product.category}`} 
                className="text-gray-500 hover:text-primary"
              >
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </a>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li className="text-gray-700 font-medium truncate">{product.title}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:grid md:grid-cols-2 md:gap-8">
            {/* Product Images */}
            <div className="p-6">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img 
                  src={selectedImage} 
                  alt={product.title}
                  className="w-full h-80 object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`border rounded-md overflow-hidden cursor-pointer ${selectedImage === image ? 'border-primary' : 'border-gray-200'}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={image} 
                      alt={`${product.title} - Image ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6 bg-gray-50">
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">{product.rating.toFixed(1)} out of 5</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  {product.discountPercentage > 0 ? (
                    <>
                      <span className="text-3xl font-bold text-primary">
                        ${finalPrice.toFixed(2)}
                      </span>
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                        {Math.round(product.discountPercentage)}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {product.stock > 0 ? (
                    <span className="text-green-600">In Stock ({product.stock} available)</span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">{product.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="text-gray-500 px-3 py-1 border rounded-l focus:outline-none hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-t border-b">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="text-gray-500 px-3 py-1 border rounded-r focus:outline-none hover:bg-gray-100"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 py-3"
                  disabled={product.stock <= 0}
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={() => setLocation('/checkout')}
                  variant="outline"
                  className="flex-1 py-3"
                  disabled={product.stock <= 0}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="p-6 border-t">
            <h2 className="text-xl font-bold mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-sm font-medium text-gray-500">Brand</td>
                      <td className="py-3 text-sm text-gray-900">{product.brand}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-sm font-medium text-gray-500">Category</td>
                      <td className="py-3 text-sm text-gray-900">{product.category}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-sm font-medium text-gray-500">Rating</td>
                      <td className="py-3 text-sm text-gray-900">{product.rating}/5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-sm font-medium text-gray-500">Stock</td>
                      <td className="py-3 text-sm text-gray-900">{product.stock} units</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-sm font-medium text-gray-500">Price</td>
                      <td className="py-3 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-sm font-medium text-gray-500">Discount</td>
                      <td className="py-3 text-sm text-gray-900">{product.discountPercentage}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="product-card"
                  onClick={() => setLocation(`/products/${relatedProduct.id}`)}
                >
                  <div className="product-card-image">
                    <img
                      src={relatedProduct.thumbnail}
                      alt={relatedProduct.title}
                      loading="lazy"
                    />
                  </div>
                  <div className="product-card-content">
                    <h3 className="product-card-title">{relatedProduct.title}</h3>
                    <p className="product-card-brand">{relatedProduct.brand}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {relatedProduct.discountPercentage > 0 ? (
                          <>
                            <span className="product-price">
                              ${(relatedProduct.price * (1 - relatedProduct.discountPercentage / 100)).toFixed(2)}
                            </span>
                            <span className="product-price-original">
                              ${relatedProduct.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="product-price">
                            ${relatedProduct.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;