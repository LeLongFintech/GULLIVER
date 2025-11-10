import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">404</h1>
        <p className="text-base text-muted-foreground mb-6">Trang bạn tìm không tồn tại.</p>
        <Link to="/" className="inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
