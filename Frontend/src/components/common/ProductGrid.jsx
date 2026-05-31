import { Skeleton } from "antd";
import ProductCard from "./ProductCard";

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="product-card-skeleton rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-premium-soft">
          <Skeleton.Image active className="product-card-skeleton-image !h-[220px] !w-full !rounded-2xl" />
          <div className="mt-5">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({ products }) {
  return (
    <div className="product-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
