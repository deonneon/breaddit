import { useState, useCallback, useEffect } from "react";
import { useTheme } from "./useTheme";

export type FontSize = "small" | "medium" | "large";

export const useUISettings = () => {
  // Use the theme hook
  const { theme, setTheme } = useTheme();

  // Add state for font size with localStorage persistence
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    return (savedFontSize || "medium") as FontSize; // Default to medium if not set
  });

  // State for mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State to track if we should show the scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Function to update font size
  const updateFontSize = useCallback((size: FontSize) => {
    setFontSize(size);
    localStorage.setItem("fontSize", size);
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Update root element class based on font size
  useEffect(() => {
    // Remove any existing font size classes
    document.documentElement.classList.remove(
      "text-size-small",
      "text-size-medium",
      "text-size-large"
    );

    // Add the current font size class
    document.documentElement.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  // Effect to handle body overflow when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("overflow-hidden"); // Disable scrolling
    } else {
      document.body.classList.remove("overflow-hidden"); // Enable scrolling
    }
  }, [sidebarOpen]);

  // Initialize page zoom from localStorage
  useEffect(() => {
    // Ensure the viewport meta tag exists
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      viewport.setAttribute("content", "width=device-width, initial-scale=1.0");
      document.head.appendChild(viewport);
    }

    // Apply saved zoom level if available
    const savedZoom = localStorage.getItem("pageZoom");
    if (savedZoom) {
      const zoomValue = parseInt(savedZoom.replace("%", "")) / 100;

      // Set CSS variable
      document.documentElement.style.setProperty(
        "--page-zoom",
        zoomValue.toString()
      );

      // Apply zoom directly (for most browsers)
      document.documentElement.style.zoom = zoomValue.toString();

      // For Firefox
      if (navigator.userAgent.indexOf("Firefox") !== -1) {
        document.body.style.transform = `scale(${zoomValue})`;
        document.body.style.transformOrigin = "top left";
        document.body.style.width = `${100 / zoomValue}%`;
      }

      // Update viewport
      viewport.setAttribute(
        "content",
        `width=device-width, initial-scale=${zoomValue}`
      );
    }
  }, []);

  return {
    fontSize,
    updateFontSize,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    showScrollTop,
    setShowScrollTop,
    theme,
    setTheme,
  };
};
