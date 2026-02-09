export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      <h1 className="text-8xl font-bold text-indigo-400 mb-4">404</h1>
      <p className="text-lg text-gray-300 mb-8">Oops! Page not found.</p>
      <a
        href="/"
        className="bg-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-700 transition text-white font-semibold"
      >
        Go Back Home
      </a>
    </div>
  );
}
