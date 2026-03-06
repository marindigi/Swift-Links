type LoadingCallback = (isLoading: boolean) => void;

class LoadingManager {
  private isLoading = false;
  private subscribers: LoadingCallback[] = [];

  setLoading(loading: boolean) {
    this.isLoading = loading;
    this.subscribers.forEach(callback => callback(loading));
  }

  subscribe(callback: LoadingCallback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  getIsLoading() {
    return this.isLoading;
  }
}

export const loadingManager = new LoadingManager();
