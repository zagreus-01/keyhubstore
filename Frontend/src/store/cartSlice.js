import { createSlice } from "@reduxjs/toolkit";
import api from "../util/api";
import { notification } from "../util/feedback";

const emptyCart = { items: [], totalPrice: 0 };

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: emptyCart,
    drawerOpen: false,
    loading: false
  },
  reducers: {
    setCart(state, action) {
      state.cart = action.payload || emptyCart;
    },
    clearCart(state) {
      state.cart = emptyCart;
    },
    setCartLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    openDrawer(state) {
      state.drawerOpen = true;
    },
    closeDrawer(state) {
      state.drawerOpen = false;
    }
  }
});

export const { clearCart, closeDrawer, openDrawer, setCart, setCartLoading } = cartSlice.actions;

const canUseCart = (auth) => String(auth.user?.role || "").toLowerCase() === "customer";

export const fetchCart = ({ silent = false } = {}) => async (dispatch, getState) => {
  if (!canUseCart(getState().auth)) {
    dispatch(clearCart());
    return emptyCart;
  }

  try {
    if (!silent) dispatch(setCartLoading(true));
    const response = await api.get("/cart");
    const nextCart = response.data.data || emptyCart;
    dispatch(setCart(nextCart));
    return nextCart;
  } catch (error) {
    if (!silent) {
      notification.error({
        title: "Không thể tải giỏ hàng",
        description: error?.response?.data?.message || error.message
      });
    }
    return emptyCart;
  } finally {
    if (!silent) dispatch(setCartLoading(false));
  }
};

export const updateCartQuantity = (variantId, quantity) => async (dispatch) => {
  if (!variantId || quantity < 1) return;

  try {
    dispatch(setCartLoading(true));
    await api.put("/cart/update", { variantId, quantity });
    await dispatch(fetchCart({ silent: true }));
  } catch (error) {
    notification.error({ title: error?.response?.data?.message || error.message });
  } finally {
    dispatch(setCartLoading(false));
  }
};

export const removeCartItem = (variantId) => async (dispatch) => {
  if (!variantId) return;

  try {
    dispatch(setCartLoading(true));
    await api.delete(`/cart/remove/${variantId}`);
    await dispatch(fetchCart({ silent: true }));
    notification.success({ title: "Đã xóa sản phẩm khỏi giỏ hàng" });
  } catch (error) {
    notification.error({ title: error?.response?.data?.message || error.message });
  } finally {
    dispatch(setCartLoading(false));
  }
};

export const selectCartState = (state) => state.cart;
export const selectCartCount = (state) =>
  (state.cart.cart.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0);

export default cartSlice.reducer;
