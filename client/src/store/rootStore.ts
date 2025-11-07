//src/store/rootStore.ts

import { configureStore } from "@reduxjs/toolkit";
import { rootApiSlice } from "./rootApiSlice";
import authReducer from "@/features/auth/store/authSlice";

const nodeEnv = import.meta.env.VITE_NODE_ENV;

const rootStore = configureStore({
  reducer: {
    auth: authReducer,
    [rootApiSlice.reducerPath]: rootApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(rootApiSlice.middleware),
  devTools: nodeEnv === "dev",
});

export type RootState = ReturnType<typeof rootStore.getState>;
export type AppDispatch = typeof rootStore.dispatch;

export default rootStore;
