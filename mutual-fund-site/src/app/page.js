// File: src/app/page.js (Corrected Version)

import Link from 'next/link'; // Notice 'Head' is no longer imported

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-yellow-300">
          Welcome to the{' '}
          <span className="text-blue-400">
            Mutual Fund Calculator!
          </span>
        </h1>

        <p className="mt-3 text-2xl text-green-300">
          Plan your investments or explore available funds.
        </p>

        <div className="mt-8 flex max-w-4xl flex-wrap items-center justify-around sm:w-full">
          <Link 
            href="/funds" 
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Explore Funds Now
          </Link>
        </div>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t">
        <a
          className="flex items-center justify-center gap-2"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by You!
        </a>
      </footer>
    </div>
  );
}