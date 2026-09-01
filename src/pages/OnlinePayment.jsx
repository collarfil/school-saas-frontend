import React, { useState, useEffect } from "react";
import axios from "axios";

export default function OnlinePayment() {
  const [gateways, setGateways] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("paystack");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get dynamic school ID from context/auth storage
  const schoolId = localStorage.getItem("school_id") || 1; 

  // Fetch configured gateways
  const fetchGateways = async () => {
    try {
      setFetching(true);
      const res = await axios.get(`/api/v1/school-gateways?school_id=${schoolId}`);
      if (res.data.status === "success") {
        setGateways(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch gateways:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post("/api/v1/school-gateways", {
        school_id: schoolId,
        provider: selectedProvider,
        api_public_key: publicKey,
        api_secret_key: secretKey,
        webhook_secret: webhookSecret,
        is_active: isActive,
      });

      if (response.data.status === "success") {
        setMessage({
          type: "success",
          text: `${selectedProvider.toUpperCase()} credentials saved and encrypted successfully!`,
        });
        setPublicKey("");
        setSecretKey("");
        setWebhookSecret("");
        fetchGateways(); // Refresh configured gateways list
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to store gateway credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 text-gray-100">
      
      {/* HEADER SECTION */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Online Payment Gateways
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage merchant API keys, webhook integrations, and active payment providers for online fee collection.
        </p>
      </div>

      {/* ALERT NOTIFICATION */}
      {message.text && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-red-950/50 border-red-800 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ACTIVE GATEWAYS LIST */}
      <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">
          Configured Gateways
        </h2>

        {fetching ? (
          <p className="text-sm text-gray-400 animate-pulse">Loading active providers...</p>
        ) : gateways.length === 0 ? (
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 text-gray-400 text-sm">
            No payment gateways have been configured yet. Set up Paystack or Stripe below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gateways.map((gw) => (
              <div
                key={gw.id}
                className="bg-gray-900/80 border border-gray-700 p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold capitalize text-white">{gw.provider}</h3>
                  <span className="text-xs text-gray-400">
                    Added: {new Date(gw.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    gw.is_active
                      ? "bg-emerald-900/40 text-emerald-400 border-emerald-700/50"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  }`}
                >
                  {gw.is_active ? "Active" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIGURATION FORM */}
      <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-2">
          Configure Gateway Credentials
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          API keys are encrypted securely before storing in the database.
        </p>

        <form onSubmit={handleSaveKeys} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="paystack">Paystack</option>
                <option value="stripe">Stripe</option>
                <option value="flutterwave">Flutterwave</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">
                  Enable Gateway for Live Transactions
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Public / Publishable Key
            </label>
            <input
              type="text"
              required
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="pk_live_... or pk_test_..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Secret Key
            </label>
            <input
              type="password"
              required
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_... or sk_test_..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Webhook Secret Signature (Optional)
            </label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3.5 py-2.5 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for real-time background transaction verification with signature headers.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg shadow-lg shadow-blue-600/30 disabled:opacity-50 transition duration-150"
            >
              {loading ? "Encrypting & Saving..." : "Save Credentials"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}