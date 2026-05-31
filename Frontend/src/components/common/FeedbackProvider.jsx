import { useEffect } from "react";
import { App as AntdApp } from "antd";
import { setNotificationApi } from "../../util/feedback";

export default function FeedbackProvider({ children }) {
  const { notification } = AntdApp.useApp();

  useEffect(() => {
    setNotificationApi(notification);
    return () => setNotificationApi(null);
  }, [notification]);

  return children;
}
