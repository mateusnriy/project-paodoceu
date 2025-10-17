import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Category, Product } from '../types/product';
import { CartItem } from '../types/order';

export const usePOS = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [catRes, prodRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/produtos'),
        ]);
        
        setCategories(catRes.data);
        setProducts(prodRes.data);
        
        if (catRes.data.length > 0) {
          setActiveCategory(catRes.data[0].id);
        }
      } catch (err) {
        setError("Erro ao carregar dados do PDV.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => product.categoria.id === activeCategory);
  }, [products, activeCategory]);

  const handleAddToCart = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find((item) => item.id === productId);
    const newQuantity = (existingItem?.quantity || 0) + 1;

    if (newQuantity > product.estoque) {
      alert(`Estoque insuficiente. Disponível: ${product.estoque}`);
      return;
    }

    if (existingItem) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.nome,
          price: product.preco,
          quantity: 1,
        },
      ]);
    }
  }, [products, cartItems]);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    const product = products.find(p => p.id === id);
    if (product && quantity > product.estoque) {
      alert(`Estoque insuficiente. Disponível: ${product.estoque}`);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, [products]);

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleFinishOrder = useCallback(async () => {
    if (cartItems.length === 0) return;

    const body = {
      itens: cartItems.map((item) => ({
        produto_id: item.id,
        quantidade: item.quantity,
      })),
    };

    try {
      const response = await api.post('/pedidos', body);
      setCartItems([]);
      navigate(`/payment/${response.data.id}`);
    } catch (error) {
      setError("Erro ao finalizar pedido. Verifique o estoque.");
    }
  }, [cartItems, navigate]);

  const handleCancelOrder = useCallback(() => {
    if (window.confirm('Deseja realmente cancelar o pedido?')) {
      setCartItems([]);
    }
  }, []);

  const toggleMobileCart = () => setShowMobileCart((prev) => !prev);

  return {
    isLoading,
    error,
    categories,
    filteredProducts,
    activeCategory,
    setActiveCategory,
    cartItems,
    showMobileCart,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleFinishOrder,
    handleCancelOrder,
    toggleMobileCart,
  };
};
