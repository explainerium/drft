import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Whether the cart drawer is open; the header button, Add to Cart and the drawer share it. */
const cartUiSlice = createSlice({
  name: "cartUi",
  initialState: { isOpen: false },
  reducers: {
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const { setCartOpen } = cartUiSlice.actions;
export const cartUiReducer = cartUiSlice.reducer;
