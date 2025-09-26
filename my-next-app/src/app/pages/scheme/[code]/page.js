"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SchemePage() {
  const params = useParams();
  const { code } = params;

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheme = async () => {
      try {
        const res = await fetch(`/api/scheme/${code}`);
        const data = await res.json();
        setScheme(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScheme();
  }, [code]);

  if (loading) return <p>Loading scheme...</p>;
  if (!scheme) return <p>No data found</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{scheme.meta.scheme_name}</h1>
      <p>Scheme Code: {scheme.meta.scheme_code}</p>
      <h2 className="mt-4 font-semibold">NAV History</h2>
      <ul className="max-h-96 overflow-y-auto border p-2 rounded">
        {scheme.data.slice(0, 20).map((nav) => (
          <li key={nav.date}>
            {nav.date}: {nav.nav}
          </li>
        ))}
      </ul>
    </div>
  );
}
