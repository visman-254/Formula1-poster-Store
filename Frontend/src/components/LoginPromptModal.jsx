import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LoginPromptModal = ({ isOpen, onOpenChange }) => {
  const navigate = useNavigate();

  const handleGuestCheckout = () => {
    onOpenChange(false);
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout Option</DialogTitle>
          <DialogDescription>
            You can continue as a guest or log in to your account to keep track of your orders.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-around mt-4">
          <Button onClick={handleGuestCheckout}>Checkout as Guest</Button>
          <Button onClick={handleLogin}>Login</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;