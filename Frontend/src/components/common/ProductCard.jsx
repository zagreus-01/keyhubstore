import { Card, Rate, Tag, Typography, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "../../util/api";

const { Text, Title } = Typography;

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const rawThumbnail = product.images?.[0] || product.thumbnail || product.variants?.[0]?.images?.[0] || "https://via.placeholder.com/320x240?text=Product";
  const thumbnail = rawThumbnail.startsWith("http") ? rawThumbnail : getBackendUrl(rawThumbnail);
  const price = product.price || 0;
  const rating = product.averageRating || 0;

  return (
    <Card
      hoverable
      cover={<img alt={product.productName} src={thumbnail} className="product-card-image" />}
      styles={{ body: { padding: 16 } }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="product-card"
    >
      <Title level={5} ellipsis>{product.productName}</Title>
      <div className="product-card-meta">
        <Text type="secondary">{product.brandId?.brandName || "No Brand"}</Text>
      </div>
      <div className="product-card-footer">
        <div>
          <Text strong>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)}</Text>
          <div>
            <Rate disabled allowHalf value={rating} style={{ fontSize: 12 }} />
            <Text type="secondary">({product.reviewCount || 0})</Text>
          </div>
        </div>
        <Button type="primary" size="small">View</Button>
      </div>
      {product.status === "hidden" && <Tag color="default">Hidden</Tag>}
      {product.sold > 0 && <Tag color="success">Sold {product.sold}</Tag>}
    </Card>
  );
}
