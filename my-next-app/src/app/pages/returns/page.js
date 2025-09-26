"use client";
import { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import Layout from "../../components/layout";

export default function ReturnsPage() {
  const [returnsData, setReturnsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      const res = await apiClient.get("/schema/returns/route");
      setReturnsData(res.data);
      setLoading(false);
    };
    fetchReturns();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Layout>
      <h2>Returns</h2>
      <pre>{JSON.stringify(returnsData, null, 2)}</pre>
    </Layout>
  );
}
