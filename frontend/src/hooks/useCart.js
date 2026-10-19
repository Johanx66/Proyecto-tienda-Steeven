import { useCartContext } from '../contexts/CartContext.jsx';

export default function useCart() {
  return useCartContext();
}
