import Layout from "@/components/Layout";
import Link from "next/link";
import {useEffect, useState} from "react";
import axios from "axios";
import Spinner from "@/components/Spinner";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsLoading(true);
    axios.get('/api/products').then(response => {
      setProducts(response.data);
      setFilteredProducts(response.data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <Link className="btn-primary" href={'/products/new'}>Add new product</Link>
      </div>
      <input
          type="text"
          placeholder="Search product..."
          className="input"
          value={searchQuery}
          onChange={ev => setSearchQuery(ev.target.value)}
        />
      <table className="basic mt-2">
        <thead>
          <tr>
            <td>Product name</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={2}>
                <div className="py-4">
                  <Spinner fullWidth={true} />
                </div>
              </td>
            </tr>
          ) : (
            filteredProducts.map(product => (
              <tr key={product._id}>
                <td>{product.title}</td>
                <td>
                  <Link className="btn-default" href={'/products/edit/' + product._id}>
                    Edit
                  </Link>
                  <Link className="btn-red" href={'/products/delete/' + product._id}>
                    Delete
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Layout>
  );
}
