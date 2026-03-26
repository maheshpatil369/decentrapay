import React from "react";
import { Navigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
export default function ProtectedRoute({ children }) {
  const { account } = useWeb3();
  return account ? children : <Navigate to="/" replace />;
}
