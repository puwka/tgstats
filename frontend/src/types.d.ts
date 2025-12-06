interface Window {
  Telegram?: {
    WebApp: {
      initData: string;
      initDataUnsafe: any;
      ready: () => void;
      expand: () => void;
      MainButton: {
        text: string;
        show: () => void;
        hide: () => void;
        onClick: (cb: () => void) => void;
      };
      themeParams: any;
    };
  };
}

