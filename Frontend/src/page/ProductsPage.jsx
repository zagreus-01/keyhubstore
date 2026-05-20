import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Col, Divider, Empty, Input, Row, Select, Skeleton, Typography } from "antd";
import api from "../util/api";
import ProductCard from "../components/common/ProductCard";

const { Title } = Typography;

const FILTER_OPTIONS = [
  { value: "", label: "All" }
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [brandId, setBrandId] = useState(searchParams.get("brandId") || "");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 12;
  const navigate = useNavigate();

  useEffect(() => {
    const getFilters = async () => {
      try {
        const [categoryRes, brandRes] = await Promise.all([api.get("/category"), api.get("/brand")]);
        setCategories(categoryRes.data.data);
        setBrands(brandRes.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    getFilters();
  }, []);

  useEffect(() => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (categoryId) params.categoryId = categoryId;
    if (brandId) params.brandId = brandId;
    setSearchParams(params);

    const fetchInitialProducts = async () => {
      setLoading(true);
      setPage(1);
      try {
        const query = new URLSearchParams({ ...params, page: 1, limit }).toString();
        const response = await api.get(`/product?${query}`);
        const newProducts = response.data.data || [];
        setProducts(newProducts);
        setHasMore(newProducts.length >= limit);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialProducts();
  }, [keyword, categoryId, brandId, setSearchParams]);

  useEffect(() => {
    if (page === 1) return;

    const fetchMoreProducts = async () => {
      setLoadingMore(true);
      try {
        const params = {};
        if (keyword) params.keyword = keyword;
        if (categoryId) params.categoryId = categoryId;
        if (brandId) params.brandId = brandId;
        
        const query = new URLSearchParams({ ...params, page, limit }).toString();
        const response = await api.get(`/product?${query}`);
        const newProducts = response.data.data || [];
        setProducts(prev => [...prev, ...newProducts]);
        setHasMore(newProducts.length >= limit);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMoreProducts();
  }, [page, keyword, categoryId, brandId]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
        if (!loading && !loadingMore && hasMore) {
          setPage(prev => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore]);

  return (
    <div className="page-products">
      <div className="page-title-row">
        <Title>All products</Title>
      </div>

      <Card className="filter-panel">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input.Search
              placeholder="Search for product"
              enterButton
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Col>
          <Col xs={24} sm={7} md={6}>
            <Select
              allowClear
              value={categoryId}
              placeholder="Category"
              onChange={(value) => setCategoryId(value)}
              style={{ width: "100%" }}
              options={[...FILTER_OPTIONS, ...categories.map((category) => ({ value: category._id, label: category.categoryName || category.name }))]}
            />
          </Col>
          <Col xs={24} sm={7} md={6}>
            <Select
              allowClear
              value={brandId}
              placeholder="Brand"
              onChange={(value) => setBrandId(value)}
              style={{ width: "100%" }}
              options={[...FILTER_OPTIONS, ...brands.map((brand) => ({ value: brand._id, label: brand.brandName || brand.name }))]}
            />
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Button type="default" block onClick={() => {
              setKeyword("");
              setCategoryId("");
              setBrandId("");
              setSearchParams({});
            }}>
              Reset filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Divider />

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Col key={index} xs={24} sm={12} md={6}><Skeleton active /><div style={{ height: 240 }} /></Col>
          ))}
        </Row>
      ) : products.length ? (
        <>
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col key={product._id} xs={24} sm={12} md={6}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
          {loadingMore && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Skeleton.Button active size="large" shape="round" />
            </div>
          )}
          {!hasMore && products.length > 0 && (
            <Divider plain>Hết sản phẩm</Divider>
          )}
        </>
      ) : (
        <Empty description="No products found" />
      )}
    </div>
  );
}
