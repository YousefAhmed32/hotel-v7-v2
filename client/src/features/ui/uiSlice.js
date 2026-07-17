import { createSlice } from '@reduxjs/toolkit';
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, sidebarCollapsed: false },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    collapseSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
  },
});
export const { toggleSidebar, collapseSidebar, setSidebarOpen } = uiSlice.actions;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export default uiSlice.reducer;
