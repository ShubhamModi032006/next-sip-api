"use client";

import { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import Layout from "../../components/layout";

export default function FundsPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const response = await apiClient.get("/mf/route"); // your API route
        setFunds(response.data);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchFunds();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Layout>
      <h2>Mutual Funds</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund) => (
            <tr key={fund.id}>
              <td>{fund.name}</td>
              <td>{fund.type}</td>
              <td>{fund.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
