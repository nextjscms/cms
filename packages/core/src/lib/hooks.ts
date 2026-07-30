type HookCallback = (data: any) => Promise<any> | any;

class HookRegistry {
  private listeners: Record<string, HookCallback[]> = {};

  /**
   * Subscribe to a CMS event hook.
   * @param event The name of the event (e.g., 'beforeSave', 'afterSave')
   * @param callback The async function to execute. If it returns data, it passes to the next hook in the chain.
   */
  on(event: string, callback: HookCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Emit a CMS event hook, sequentially waiting for all async callbacks to finish.
   * Modifies data in a waterfall style if callbacks return a new value.
   */
  async emit(event: string, data?: any) {
    let currentData = data;
    
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        // Await the callback. If it returns something, update currentData for the next hook
        const result = await callback(currentData);
        if (result !== undefined) {
          currentData = result;
        }
      }
    }
    
    return currentData;
  }
}

// Export a global singleton for the entire CMS to use
export const nextjscms = new HookRegistry();
