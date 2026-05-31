import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop — cuộn về đầu trang mỗi khi route thay đổi.
 * Đặt component này bên trong <BrowserRouter> nhưng bên ngoài <Routes>.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
