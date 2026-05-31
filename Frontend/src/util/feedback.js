let notificationApi = null;

const normalizeNotificationConfig = (config) => {
  if (!config || typeof config !== "object" || !("message" in config) || "title" in config) {
    return config;
  }

  const { message, ...rest } = config;
  return {
    ...rest,
    title: message
  };
};

export function setNotificationApi(api) {
  notificationApi = api;
}

export const notification = {
  success(config) {
    notificationApi?.success(normalizeNotificationConfig(config));
  },
  error(config) {
    notificationApi?.error(normalizeNotificationConfig(config));
  },
  warning(config) {
    notificationApi?.warning(normalizeNotificationConfig(config));
  },
  info(config) {
    notificationApi?.info(normalizeNotificationConfig(config));
  }
};
