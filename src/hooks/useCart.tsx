import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
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
    const storagedCart = localStorage.getItem("@rocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart); // será preciso transformar o storagedCart em JSON, ja que a
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const upgradeCart = [...cart]; // todos os produtos passados.
      const verifyCart = upgradeCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockApi = stock.data.amount; // quantidade no estoque
      const currentAmount = verifyCart ? verifyCart.amount : 0; //quantidade do produto atual ( no carrinho )
      // se existe no carrinho eu pego a quantidade dele, se nao existe, é ZERO.


      const amount = currentAmount + 1; // quantidade desejada, é a quantidade atual + 1.


      if (amount > stockApi) { // Se a quantidade atual for maior que a quantidade no stock, retorna um erro
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (verifyCart) { //se o produto existe, eu atualizo a quantidade de produtos
        verifyCart.amount = amount;
      } else {  // se o produto nao existe no carrinho, eu vou adicionar um produto novo
        // eu busco o produto na api
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        // depois tem que perpetuar ele no cart, no caso nossa variavel upgradeCart
        upgradeCart.push(newProduct)
      }
      setCart(upgradeCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(upgradeCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const upgradeCart = [...cart];  // todos os produtos passados.
      const verifyCartIndex = upgradeCart.findIndex(product => product.id === productId);

      if (verifyCartIndex >= 0) {
        upgradeCart.splice(verifyCartIndex, 1);
        setCart(upgradeCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(upgradeCart))

      } else {
        throw Error();

      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(string))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const upgradeCart = [...cart];
      const verifyCart = upgradeCart.find(product => product.id === productId);

      if (verifyCart) {
        verifyCart.amount = amount;
        setCart(upgradeCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(upgradeCart));
      } else {
        throw Error()
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
