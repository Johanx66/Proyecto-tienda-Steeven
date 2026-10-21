import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cart_items';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, cantidad = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.producto_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.producto_id === product.id
            ? { ...i, cantidad: Math.min(i.cantidad + cantidad, product.stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          producto_id: product.id,
          nombre: product.nombre,
          precio: parseFloat(product.precio),
          stock: product.stock,
          imagen_url: product.imagen_url,
          cantidad,
        },
      ];
    });
  };

  const updateQuantity = (productoId, cantidad) => {
    setItems((prev) =>
      prev.map((i) =>
        i.producto_id === productoId
          ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) }
          : i
      )
    );
  };

  const removeItem = (productoId) => {
    setItems((prev) => prev.filter((i) => i.producto_id !== productoId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const count = items.reduce((sum, i) => sum + i.cantidad, 0);

  const value = { items, addItem, updateQuantity, removeItem, clearCart, total, count };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartContext debe usarse dentro de CartProvider');
  return context;
}

export default CartContext;
