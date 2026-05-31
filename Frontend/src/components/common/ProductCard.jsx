import { Button, Card, Rate, Tag, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
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
      cover={
        <div className="product-card-media">
          <img alt={product.productName} src={thumbnail} className="product-card-image" />
          {product.sold > 0 && <Tag color="success" className="product-card-badge">Sold {product.sold}</Tag>}
        </div>
      }
      styles={{ body: { padding: 16 } }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="product-card"
    >
      <Text className="product-card-brand">{product.brandId?.brandName || "No Brand"}</Text>
      <Title level={5} ellipsis>{product.productName}</Title>
      <div className="product-card-rating">
        <Rate disabled allowHalf value={rating} />
        <Text type="secondary">({product.reviewCount || 0})</Text>
      </div>
      <div className="product-card-footer">
        <div>
          <Text className="product-card-price" strong>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)}</Text>
        </div>
        <Button type="primary" size="small" icon={<EyeOutlined />}>View</Button>
      </div>
      {product.status === "hidden" && <Tag color="default">Hidden</Tag>}
    </Card>
  );
}
