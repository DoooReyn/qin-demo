/**
 * Debug Panel Type Definitions
 * Provides type definitions for the global DebugPanel interface
 */

declare global {
    /**
     * Global DebugPanel interface for managing debug information
     */
    interface DebugPanelInterface {
        /**
         * Show the debug panel
         */
        show(): void;

        /**
         * Hide the debug panel
         */
        hide(): void;

        /**
         * Toggle the debug panel visibility (minimize/maximize)
         */
        toggle(): void;

        /**
         * Add a new debug item to the panel
         * @param key - Unique identifier for the debug item
         * @param title - Display title for the debug item
         * @param value - Initial value for the debug item (optional)
         * @returns The created HTML element
         */
        addItem(key: string, title: string, value?: string): HTMLElement;

        /**
         * Update the value of an existing debug item
         * @param key - Unique identifier of the debug item to update
         * @param value - New value to display
         */
        updateItem(key: string, value: string): void;

        /**
         * Remove a debug item from the panel
         * @param key - Unique identifier of the debug item to remove
         */
        removeItem(key: string): void;

        /**
         * Clear all debug items from the panel
         */
        clear(): void;
    }

    /**
     * Global DebugPanel instance
     */
    var debugPanel: DebugPanelInterface;

    /**
     * Window interface extension to include DebugPanel
     */
    interface Window {
        debugPanel: DebugPanelInterface;
    }
}

/**
 * Debug item configuration interface
 */
export interface DebugItem {
    key: string;
    title: string;
    value: string;
}

/**
 * Debug panel configuration options
 */
export interface DebugPanelConfig {
    /**
     * Initial position of the panel
     */
    position?: {
        top?: number;
        left?: number;
        right?: number;
        bottom?: number;
    };

    /**
     * Initial size of the panel
     */
    size?: {
        width?: number;
        height?: number;
    };

    /**
     * Whether to show the panel initially
     */
    visible?: boolean;

    /**
     * Whether the panel starts minimized
     */
    minimized?: boolean;

    /**
     * Custom CSS class for styling
     */
    className?: string;
}

export {};