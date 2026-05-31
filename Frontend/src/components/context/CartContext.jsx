import { useEffect } from "react";
import CartDrawer from "../cart/CartDrawer";
import useAuth from "./useAuth";
import { clearCart, fetchCart } from "../../store/cartSlice";
import { useAppDispatch } from "../../store/hooks";

export function CartProvider({ children }) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const isCustomer = String(user?.role || "").toLowerCase() === "customer";

  useEffect(() => {
    if (user && isCustomer) {
      dispatch(fetchCart({ silent: true }));
    } else {
      dispatch(clearCart());
    }
  }, [dispatch, isCustomer, user]);

  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
}
