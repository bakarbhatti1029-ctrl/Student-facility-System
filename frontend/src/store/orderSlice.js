import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../utils/api';

// Async action to fetch orders for a specific customer
export const getOrdersForCustomer = createAsyncThunk(
  'orders/getOrdersForCustomer',
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${API_BASE_URL}/api/order/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async action to fetch orders for a kitchen
export const getOrdersForKitchen = createAsyncThunk(
  'orders/getOrdersForKitchen',
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${API_BASE_URL}/api/order/kitchen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
      });
    }
  }
);

// Async action to update the order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const token = Cookies.get('token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/order/update/${orderId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { orderId, status };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async action to remove an order
export const removeOrder = createAsyncThunk(
  'orders/removeOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`${API_BASE_URL}/api/order/delete/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return orderId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    loading: false,
    error: null,
    chartData: [],
  },
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
    },
    addNewOrder: (state, action) => {
      state.orders.push(action.payload); // Add new order to the list of orders
    },
    updateOrderInState: (state, action) => {
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload; // Replace the updated order
      }
    },

    addOrderToChart: (state, action) => {
      const orderId = action.payload;
      const completedOrder = state.orders.find(order => order._id === orderId);
      
      // Assuming order has a 'completedAt' field or you can use current date
      const month = new Date().getMonth();  // Get current month or use completedAt date
      const existingMonthData = state.chartData.find(data => data.month === month);

      if (existingMonthData) {
        existingMonthData.orderCount += 1;  // Increment order count for that month
      } else {
        state.chartData.push({ month, orderCount: 1 });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders for customer
      .addCase(getOrdersForCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOrdersForCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getOrdersForCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch orders for kitchen
      .addCase(getOrdersForKitchen.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOrdersForKitchen.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getOrdersForKitchen.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order._id === action.payload.orderId);
        if (index !== -1) {
          state.orders[index].status = action.payload.status;
        }
      })
      // Remove order
      .addCase(removeOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(order => order._id !== action.payload);
      });
  },
});

export const { clearOrders, addNewOrder, updateOrderInState,addOrderToChart} = ordersSlice.actions;
export default ordersSlice.reducer;
