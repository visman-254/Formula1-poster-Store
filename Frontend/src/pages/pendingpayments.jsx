// src/pages/PendingPayment.jsx
import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE from "../config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const PendingPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { checkoutRequestID: stateId, amount, phone } = location.state || {};
  const [status, setStatus] = useState("Waiting for payment...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = stateId || localStorage.getItem("checkoutRequestID");
    if (!id) return navigate("/cart");

    localStorage.setItem("checkoutRequestID", id);
    let cancelled = false;

    const pollStatus = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/mpesa/status/${id}`);
        if (cancelled) return;

        if (data.status === "paid") {
          setStatus("Payment confirmed! Order created.");
          setLoading(false);
          localStorage.removeItem("checkoutRequestID");
        } else if (data.status === "failed") {
          setStatus("Payment failed or cancelled.");
          setLoading(false);
          localStorage.removeItem("checkoutRequestID");
        } else {
          setTimeout(pollStatus, 5000);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setTimeout(pollStatus, 5000);
      }
    };

    pollStatus();
    return () => (cancelled = true);
  }, [stateId, navigate]);

  const retryPayment = () => {
    localStorage.removeItem("checkoutRequestID");
    navigate("/cart");
  };

  const getStatusBadge = () => {
    if (status.includes("confirmed")) return <Badge variant="success">Success</Badge>;
    if (status.includes("failed")) return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Track your M-Pesa payment in real-time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span>Kshs {amount || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{phone || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Status:</span>
            {getStatusBadge()}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin w-4 h-4" />
              <span>Checking payment status...</span>
            </div>
          )}

          {status === "Payment confirmed! Order created." && (
            <Button asChild variant="default" className="w-full">
              <Link to="/orders">Go to My Orders</Link>
            </Button>
          )}

          {status === "Payment failed or cancelled." && (
            <Button onClick={retryPayment} variant="destructive" className="w-full">
              Retry Payment
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingPayment;
