// src/lib/store/slices/sidebarSlice.ts
import { createSlice } from "@reduxjs/toolkit";

interface SidebarState {
  isCollapsed: boolean;
}

const initialState: SidebarState = {
  isCollapsed: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleCollapse(state) {
      state.isCollapsed = !state.isCollapsed;
    },
    setCollapse(state, action) {
      state.isCollapsed = action.payload;
    },
  },
});

export const { toggleCollapse, setCollapse } = sidebarSlice.actions;
export default sidebarSlice.reducer;
