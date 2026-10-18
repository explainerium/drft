import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";

/**
 * Built once at module scope, not inside makeStore: combineReducers probes the
 * reducers with a Math.random() action type, and Cache Components rejects
 * Math.random() during a prerender render.
 */
const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
});

/** A fresh store per request on the server, one per tab in the browser (see StoreProvider). */
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
