// Moved from lib/features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any | null;
  token: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isInitialized = true;
      
      // Save to localStorage for persistence across browser sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem('authUser', JSON.stringify(action.payload.user));
        localStorage.setItem('authToken', action.payload.token);

      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isInitialized = true;
      
      // Clear localStorage on logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    },
    initializeAuth: (state, action: PayloadAction<{ user: any; token: string, shopId?: string } | null>) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
      }
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
