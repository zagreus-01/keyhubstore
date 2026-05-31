import { useCallback, useMemo } from "react";
import {
  closeDrawer,
  fetchCart as fetchCartThunk,
  openDrawer,
  removeCartItem as removeCartItemThunk,
  selectCartCount,
  selectCartState,
  setCart as setCartAction,
  updateCartQuantity as updateCartQuantityThunk
} from "../../store/cartSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export default function useCart() {
  const dispatch = useAppDispatch();
  const { cart, drawerOpen, loading } = useAppSelector(selectCartState);
  const cartCount = useAppSelector(selectCartCount);

  const closeCartDrawer = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const openCartDrawer = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      await dispatch(fetchCartThunk({ silent: true }));
    }
    dispatch(openDrawer());
  }, [dispatch]);

  const fetchCurrentCart = useCallback((options) => dispatch(fetchCartThunk(options)), [dispatch]);
  const removeCurrentCartItem = useCallback((variantId) => dispatch(removeCartItemThunk(variantId)), [dispatch]);
  const setCurrentCart = useCallback((nextCart) => dispatch(setCartAction(nextCart)), [dispatch]);
  const updateCurrentCartQuantity = useCallback(
    (variantId, quantity) => dispatch(updateCartQuantityThunk(variantId, quantity)),
    [dispatch]
  );

  return useMemo(
    () => ({
      cart,
      cartCount,
      closeCartDrawer,
      drawerOpen,
      fetchCart: fetchCurrentCart,
      loading,
      openCartDrawer,
      removeCartItem: removeCurrentCartItem,
      setCart: setCurrentCart,
      updateCartQuantity: updateCurrentCartQuantity
    }),
    [
      cart,
      cartCount,
      closeCartDrawer,
      drawerOpen,
      fetchCurrentCart,
      loading,
      openCartDrawer,
      removeCurrentCartItem,
      setCurrentCart,
      updateCurrentCartQuantity
    ]
  );
}
