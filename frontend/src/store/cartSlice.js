import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

// Add to cart API
export const addToCartAPI = createAsyncThunk('cart/addToCartAPI', async ({ kitchenId, productId, quantity }, { rejectWithValue }) => {

  try {
    const response = await axios.post(`${API_BASE_URL}/api/cart/addItem`, 
      { kitchenId, productId, quantity }, 
      {
        headers: {
          
        } }
    );
    return response.data.cartSummary; // Only return cart summary (itemCount and kitchenCount)
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Return a specific error message for token issues
      return rejectWithValue({ message: 'Invalid or expired token' });
    }
    return rejectWithValue(error.response?.data || 'Failed to add item to cart');
  }
});

// Get user's cart API
export const getCartAPI = createAsyncThunk('cart/getCartAPI', async () => {

  const response = await axios.get(`${API_BASE_URL}/api/cart/getItem`, {
    headers: {
      
    } });

  if (response.data.message === "No items in cart") {
    return { carts: [], message: response.data.message };
  }

  return response.data;
});

// Remove item from cart API
export const removeFromCartAPI = createAsyncThunk('cart/removeFromCartAPI', async ({ kitchenId, productId }) => {

  await axios.delete(`${API_BASE_URL}/api/cart/${kitchenId}/${productId}`, {
    headers: {
      
    } });
  return { kitchenId, productId };
});

// Update item quantity API
export const updateItemQuantityAPI = createAsyncThunk('cart/updateItemQuantityAPI', async ({ kitchenId, productId, quantity }) => {

  const response = await axios.put(`${API_BASE_URL}/api/cart/updateItem/${kitchenId}/${productId}`, { quantity }, {
    headers: {
      
    } });
  return response.data.cartSummary;
});

// Clear cart API
export const clearCartAPI = createAsyncThunk('cart/clearCartAPI', async ({ kitchenId }) => {

  console.log('Clearing cart for kitchen:', kitchenId);
  await axios.delete(`${API_BASE_URL}/api/cart/${kitchenId}`, {
    headers: {
      
    } });
  return kitchenId;
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { carts: [], totalItems: 0, kitchenCount: 0, loading: false, error: null },
  reducers: {
    updateCartSummary: (state, action) => {
      state.totalItems = action.payload.itemCount; // Update from login response
      state.kitchenCount = action.payload.kitchenCount;
    } },
  extraReducers: (builder) => {
    builder
      // Handle add to cart
      .addCase(addToCartAPI.fulfilled, (state, action) => {
        const { itemCount, kitchenCount } = action.payload;
        state.totalItems = itemCount;
        state.kitchenCount = kitchenCount;
      })

      // Handle get cart
      .addCase(getCartAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCartAPI.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.carts.length > 0) {
          state.carts = action.payload.carts;
          state.totalItems = state.carts.reduce((total, cart) => total + cart.items.reduce((subTotal, item) => subTotal + item.quantity, 0), 0);
          state.kitchenCount = state.carts.length;
          state.message = null; // Clear the message if there are items
        } else {
          state.carts = []; // Empty cart
          state.totalItems = 0;
          state.kitchenCount = 0;
          state.message = action.payload.message; // Save the "No items in cart" message
        }
      })
      .addCase(getCartAPI.rejected, (state) => {
        state.loading = false;
      })
      // Handle remove item from cart
      .addCase(removeFromCartAPI.fulfilled, (state, action) => {
        const { productId } = action.payload;
        state.carts = state.carts.map(cart => ({
          ...cart,
          items: cart.items.filter(item => item.productId._id !== productId) })).filter(cart => cart.items.length > 0);

        // Recalculate totalItems after removing an item
        state.totalItems = state.carts.reduce((total, cart) => {
          return total + cart.items.reduce((subTotal, item) => subTotal + item.quantity, 0);
        }, 0);

        state.kitchenCount = state.carts.length;
      })

      // Handle update item quantity
        .addCase(updateItemQuantityAPI.fulfilled, (state, action) => {
          const { itemCount, totalPrice } = action.payload; // This is the correct payload

          // Update the quantity in the local cart state based on the productId and kitchenId
          state.carts = state.carts.map(cart => ({
              ...cart,
              items: cart.items.map(item => {
                  // Find the item by productId and update its quantity
                  if (item.productId._id === action.meta.arg.productId) {
                      return { ...item, quantity: action.meta.arg.quantity };
                  }
                  return item;
              }) }));

          // Update the cart summary (total items and total price)
          state.totalItems = itemCount;
          state.totalPrice = totalPrice; // You might want to track totalPrice if needed
        })

        .addCase(clearCartAPI.fulfilled, (state, action) => {
          const kitchenId = action.payload;
      
          // Remove the cart for the specific kitchen entirely
          state.carts = state.carts.filter(cart => cart.kitchenId !== kitchenId);
      
          // Recalculate the totalItems and kitchenCount based on the remaining carts
          state.totalItems = state.carts.reduce((total, cart) => {
            return total + cart.items.reduce((subTotal, item) => subTotal + item.quantity, 0);
          }, 0);
          state.kitchenCount = state.carts.length;
      })     
      // Handle loading and errors
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.error.message;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state) => {
          state.loading = false;
        }
      );
  } });

export const { updateCartSummary } = cartSlice.actions;
export default cartSlice.reducer;
