import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { ProductList } from '../pages/Home/styles';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return []
  });

  const addProduct = async (productId: number) => {
    try {
      const listProducts = [...cart];
      console.log(listProducts);
      const productExist = listProducts.find(product => product.id === productId);

      const stockAmount = await api.get<Stock>(`/stock/${productId}`).then(response => { return response.data.amount });

      if (productExist) {
        if (productExist.amount >= stockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        productExist.amount += 1;
        setCart(listProducts);

      } else {
        const responseProduct = await api.get(`/products/${productId}`).then(response => { return response.data });

        const newItem = {
          ...responseProduct,
          amount: 1
        }

        listProducts.push(newItem);
        setCart(listProducts);
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(listProducts));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const listProducts = [...cart];

      const productExist = listProducts.find(product => product.id === productId);

      if (productExist) {
        const filterList = listProducts.filter(product => product.id !== productId);
        setCart(filterList);
        localStorage.setItem('@RocketShoes:cart',
          JSON.stringify(filterList));
      } else {
        throw new Error();

      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const listProducts = [...cart];
      
      if (amount <= 0) {
        return 
      } else {
        const productAmount = await api.get<Stock>(`/stock/${productId}`).then(response => { return response.data.amount });

        if (amount > productAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        } else {
          const productExist = listProducts.find(product => product.id === productId);

          if (productExist) {
            productExist.amount = amount;
            setCart(listProducts);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(listProducts));
          } else {
            throw new Error();
          }
        }
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
